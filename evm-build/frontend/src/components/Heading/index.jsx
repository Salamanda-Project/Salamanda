import React from "react";

const sizes = {
  heading_heading_2xl: "text-[56px] font-black md:text-[48px] sm:text-[42px]",
  heading_heading_md: "text-[24px] font-semibold md:text-[22px]",
  body_body_sm_medium: "text-[14px] font-medium",
  body_body_sm_semibold: "text-[14px] font-semibold",
  body_body_xs_semibold: "text-[12px] font-semibold",
  heading_heading_xl: "text-[40px] font-bold md:text-[38px] sm:text-[36px]",
  heading_heading_sm: "text-[18px] font-semibold",
};

const Heading = ({
  children,
  className = "",
  size = "heading_heading_md",
  as,
  ...restProps
}) => {
  const Component = as || "h6";
  return (
    <Component
      className={`text-white-a700 font-archivo ${className} ${sizes[size]}`}
      {...restProps}
    >
      {children}
    </Component>
  );
};

export { Heading };
