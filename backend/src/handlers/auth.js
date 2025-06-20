export const login = async (event) => {
  console.log(event);
  event.body = JSON.parse(event.body);
  console.log(event.body);
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Hello World' }),
  };
};