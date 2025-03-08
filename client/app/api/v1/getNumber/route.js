export async function GET(request) {
  try {
    const data = await fetch('http://localhost:5000/api/v1/getnanoid', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.API_KEY,
      },
    });

    const number = await data.json();

    return Response.json(number);
  } catch (error) {
    return Response.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
