export async function GET() {
  try {
    return Response.json({ message: "API is working" });
  } catch (error: any) {
    console.log(error);
    return Response.json(
      { message: "API is not working", error },
      { status: 500 },
    );
  }
}
