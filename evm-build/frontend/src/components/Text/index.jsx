import React from "react";

const sizes = {
  body_body_sm_default: "text-[14px] font-normal",
  body_body_xs_default: "text-[12px] font-normal",
  body_body_lg_default: "text-[20px] font-normal",
};

const Text = ({
  children,
  className = "",
  as = "p",
  size = "body_body_sm_default",
  ...restProps
}) => {
  const Component = as;
  return (
    <Component
      className={`text-gray-400 font-archivo ${className} ${sizes[size]}`}
      {...restProps}
    >
      {children}
    </Component>
  );
};

export { Text };
