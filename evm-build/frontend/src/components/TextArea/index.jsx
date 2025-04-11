import React from "react";
import PropTypes from "prop-types";

const shapes = {
  round: "rounded-lg",
};

const variants = {
  tarFillGray900: "bg-gray-900",
};

const sizes = {
  xs: "h-[96px] p-2.5 text-[14px]",
};

const TextArea = React.forwardRef(
  (
    {
      className = "",
      name = "",
      placeholder = "",
      shape,
      size = "xs",
      variant = "tarFillGray900",
      onChange,
      ...restProps
    },
    ref
  ) => {
    const handleChange = (e) => {
      if (onChange) {
        // Creating a synthetic event object that mimics the structure expected by the parent
        const syntheticEvent = {
          target: {
            name: name,
            value: e?.target?.value
          }
        };
        onChange(syntheticEvent);
      }
    };

    return (
      <textarea
        ref={ref}
        className={`${className} ${shape && shapes[shape]} ${size && sizes[size]} ${variant && variants[variant]}`}
        name={name}
        onChange={handleChange}
        placeholder={placeholder}
        {...restProps}
      />
    );
  }
);

TextArea.propTypes = {
  className: PropTypes.string,
  name: PropTypes.string,
  placeholder: PropTypes.string,
  shape: PropTypes.oneOf(["round"]),
  size: PropTypes.oneOf(["xs"]),
  variant: PropTypes.oneOf(["tarFillGray900"]),
  onChange: PropTypes.func,
};

export { TextArea };