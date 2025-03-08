export async function POST(request) {
  try {
    const body = await request.json();

    // console.log('nextjs api body: ', body);

    const response = await fetch('http://localhost:5000/api/v1/getsingle', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.API_KEY,
      },
      body: JSON.stringify(body),
    });

    const singleUseFacilityId = await response.json();

    // console.log('next js api sufi: ', singleUseFacilityId);

    return Response.json(singleUseFacilityId);
  } catch (error) {
    return Response.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
