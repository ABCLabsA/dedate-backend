export class ServiceError extends Error {
  status: number; // HTTP 状态码
  code?: number;  // 业务错误码，可选

  constructor(message: string, status = 400, code?: number) {
    super(message);
    this.status = status;
    this.code = code;
    // 维护原型链
    Object.setPrototypeOf(this, ServiceError.prototype);
  }
}