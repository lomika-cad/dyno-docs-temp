namespace Application.Common;

public class Result
{
  internal Result(bool succeeded, string message, string[] errors)
        {
            Succeeded = succeeded;
            Errors = errors;
            Message = message;
            DateTime = DateTime.Now;
        }

        internal Result(string message)
        {
            Succeeded = false;
            IsPending = true;
            Errors = Array.Empty<string>();
            Message = message;
            DateTime = DateTime.Now;
        }

        internal Result(string message, string requestId)
        {
            Succeeded = false;
            IsPending = true;
            Errors = Array.Empty<string>();
            Message = message;
            RequestId = requestId;
            DateTime = DateTime.Now;
        }

        public bool Succeeded { get; set; }
        public bool IsPending { get; set; }
        public string RequestId { get; set; }
        public DateTime DateTime { get; set; }
        public string Message { get; set; }
        public string[] Errors { get; set; }

        private dynamic? Data { get; set; }
        private Type? Type { get; set; }

        public void SetData<T>(T? data)
        {
            Type = typeof(T);
            Data = data;
        }

        public T? GetData<T>() where T : class, new()
        {
            if (Data != null && typeof(T) == Type)
                return (T)Data!;
            else
                return null;
        }

        public static Result Success()
        {
            return new Result(true, "Operation is success", Array.Empty<string>());
        }

        public static Result Success(string message)
        {
            return new Result(true, message, Array.Empty<string>());
        }

        public static Result Pending(string message = "Operation is going on")
        {
            return new Result("Operation is failed");
        }

        public static Result Failure(params string[] errors)
        {
            return new Result(false, "Operation is failed", errors);
        }

        public static Result Failure(string message, params string[] errors)
        {
            return new Result(false, message, errors);
        }  
}