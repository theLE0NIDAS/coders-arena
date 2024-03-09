import { OJ_TOKEN_KEY } from "../common/constants";

class AuthValidationService {
  static isAutheticated = (): boolean => {
    return localStorage.getItem(OJ_TOKEN_KEY) !== null;
  };
}

export default AuthValidationService;
