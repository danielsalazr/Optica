declare module "intl-tel-input/react/build/IntlTelInputWithUtils" {
  import * as React from "react";

  type IntlTelInputProps = {
    onChangeNumber?: (value: string) => void;
    onChangeValidity?: (isValid: boolean) => void;
    initOptions?: Record<string, unknown>;
  };

  const IntlTelInput: React.ComponentType<IntlTelInputProps>;
  export default IntlTelInput;
}

declare module "intl-tel-input/styles";
