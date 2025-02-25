export async function GET(request) {
  const multi = request.nextUrl.pathname.split('/getTrigger/')[1];

  try {
    await fetch(`http://localhost:5000/api/v1/trigger/${multi}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.API_KEY,
      },
    });

    return Response.json({ message: 'ok' });
  } catch (error) {
    return Response.json({ message: error.message }, { status: 500 });
  }
}
