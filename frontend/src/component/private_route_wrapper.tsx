import { FC } from "react";
import AuthRequiredComponent from "../screen/auth_require_component";
import AuthValidationService from "../service/auth_validation_service";

interface PrivateRouteWrapperProps {
  element: JSX.Element;
}

const PrivateRouteWrapper = (props: PrivateRouteWrapperProps) => {
  return AuthValidationService.isAutheticated() ? (
    props.element
  ) : (
    <AuthRequiredComponent />
  );
};

export default PrivateRouteWrapper;
