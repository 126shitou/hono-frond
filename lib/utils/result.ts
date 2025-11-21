type Success<T> = {
  success: true;
  data: T;
  message: string;
};

type Failure = {
  success: false;
  data?: any;
  message: string;
};

export type ResultType<T> = Success<T> | Failure;

export const Result = {
  success<T>(data: T, message: string = ""): ResultType<T> {
    return { success: true, data, message };
  },
  fail(error: string, data?: any): ResultType<never> {
    return { success: false, message: error, data: data || null };
  },
};
  