import { createContext, useContext, useEffect, useState } from 'react';

const VoiceContext = createContext();

const VoiceProvider = ({ children }) => {
  const [selectedVoice, setSelectedVoice] = useState(null);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices();

      // Prefer 'ms-MY', fallback to 'en-US'
      const malayVoice = availableVoices.find(
        (voice) => voice.lang === 'ms-MY'
      );
      const fallbackVoice = availableVoices.find(
        (voice) => voice.lang === 'en-US'
      );

      if (malayVoice) {
        setSelectedVoice(malayVoice);
        // console.log(`Using Malay voice: ${malayVoice.name}`);
      } else if (fallbackVoice) {
        setSelectedVoice(fallbackVoice);
        // console.log(`Using fallback English voice: ${fallbackVoice.name}`);
      } else if (availableVoices.length) {
        setSelectedVoice(availableVoices[0]); // If no preferred, use first
        // console.log(`Using default voice: ${availableVoices[0].name}`);
      }
    };

    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }

    loadVoices();
  }, []);

  return (
    <VoiceContext.Provider value={{ selectedVoice }}>
      {children}
    </VoiceContext.Provider>
  );
};

const GlobalVoiceContext = () => {
  return useContext(VoiceContext);
};

export { VoiceProvider, GlobalVoiceContext };
