// app/types/api.ts
export interface ApiRegistry {
  "/api/chat": {
    input: {
      message: string;
    };
    response: Response;
  };
}
