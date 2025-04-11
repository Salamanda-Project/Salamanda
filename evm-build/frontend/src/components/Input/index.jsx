import React from "react";
import PropTypes from "prop-types";

const shapes = {
  round: "rounded-lg",
};

const variants = {
  fill: {
    gray_900: "bg-gray-900 text-blue_gray-900",
  },
};

const sizes = {
  xs: "h-[40px] px-2.5 text-[14px]",
};

const Input = React.forwardRef(
  (
    {
      className = "",
      name = "",
      placeholder = "",
      type = "text",
      label = "",
      prefix,
      suffix,
      onChange,
      shape,
      variant = "fill",
      size = "xs",
      color = "gray_900",
      ...restProps
    },
    ref
  ) => {
    return (
      <label
        className={`${className} flex items-center justify-center self-stretch cursor-text text-blue_gray-900 text-[14px] bg-gray-900 rounded-lg 
        ${shape && shapes[shape]} 
        ${variant && (variants[variant]?.[color] || variants[variant])} 
        ${size && sizes[size]}`}
      >
        {!!label && label}
        {!!prefix && prefix}
        <input
          ref={ref}
          type={type}
          name={name}
          placeholder={placeholder}
          onChange={onChange}
          {...restProps}
        />
        {!!suffix && suffix}
      </label>
    );
  }
);

Input.propTypes = {
  className: PropTypes.string,
  name: PropTypes.string,
  placeholder: PropTypes.string,
  type: PropTypes.string,
  label: PropTypes.string,
  prefix: PropTypes.node,
  suffix: PropTypes.node,
  shape: PropTypes.oneOf(["round"]),
  size: PropTypes.oneOf(["xs"]),
  variant: PropTypes.oneOf(["fill"]),
  color: PropTypes.oneOf(["gray_900"]),
};

export { Input };
