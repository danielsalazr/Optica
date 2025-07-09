'use client'
import dynamic from "next/dynamic";
// import IntlTelInput from "intl-tel-input/react/build/IntlTelInputWithUtils";
const IntlTelInput = dynamic(() => import("intl-tel-input/react/build/IntlTelInputWithUtils"), {
  ssr: false,
});
import "intl-tel-input/styles";


import React, { useState } from "react";
function PhoneInputIntl() {
    
    const [value, setValue] = useState()
  return (
    <div>
      <IntlTelInput
        onChangeNumber={setValue}
        // onChangeValidity={setIsValid}
        initOptions={{
            initialCountry: "co",
        }}
      />
    </div>
  )
}

export default PhoneInputIntl


