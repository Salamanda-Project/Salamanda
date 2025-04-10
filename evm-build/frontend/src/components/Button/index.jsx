import React from "react";
import PropTypes from "prop-types";

const shapes = {
  round: "rounded-lg",
  square: "rounded-[0px]",
};

const variants = {
  fill: {
    black_900: "bg-black-900 text-red-400",
    gray_900: "bg-gray-900",
  },
};

const sizes = {
  xs: "h-[40px] px-2.5 text-[14px]",
  sm: "h-[48px] px-3",
};

const Button = ({
  children,
  className = "",
  leftIcon,
  rightIcon,
  shape,
  variant = "fill",
  size = "sm",
  color = "gray_900",
  ...restProps
}) => {
  return (
    <button
      className={`${className} flex flex-row items-center justify-center text-center cursor-pointer whitespace-nowrap ${
        shape && shapes[shape]
      } ${size && sizes[size]} ${variant && variants[variant]?.[color]}`}
      {...restProps}
    >
      {!!leftIcon && leftIcon}
      {children}
      {!!rightIcon && rightIcon}
    </button>
  );
};

Button.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
  leftIcon: PropTypes.node,
  rightIcon: PropTypes.node,
  shape: PropTypes.oneOf(["round", "square"]),
  size: PropTypes.oneOf(["xs", "sm"]),
  variant: PropTypes.oneOf(["fill"]),
  color: PropTypes.oneOf(["black_900", "gray_900"]),
};

export { Button };
