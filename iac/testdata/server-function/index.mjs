export async function handler() {
  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true }),
    headers: {
      'content-type': 'application/json',
    },
  };
}
