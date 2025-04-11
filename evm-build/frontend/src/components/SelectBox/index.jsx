import React from "react";
import Select from "react-select";
import PropTypes from "prop-types";

const shapes = {
  round: "rounded-lg",
};

const variants = {
  fill: {
    gray_900: "bg-gray-900 text-blue_gray-900",
  },
  outline: {
    blue_gray_900: "border-blue_gray-900 border-[0.5px] border-solid text-white-a700",
  },
};

const sizes = {
  xs: "h-[40px] px-2.5 text-[14px]",
};

const SelectBox = React.forwardRef(
  (
    {
      children,
      className = "",
      options = [],
      isSearchable = false,
      isMulti = false,
      indicator,
      shape,
      variant = "outline",
      size = "xs",
      color = "blue_gray_900",
      ...restProps
    },
    ref
  ) => {
    return (
      <>
        <Select
          ref={ref}
          options={options}
          className={`${className} flex ${shape && shapes[shape]} ${size && sizes[size]} ${variant && variants[variant]?.[color]}`}
          isSearchable={isSearchable}
          isMulti={isMulti}
          components={{
            IndicatorSeparator: () => null,
            ...(indicator && { DropdownIndicator: () => indicator }),
          }}
          styles={{
            indicatorsContainer: (provided) => ({
              ...provided,
              padding: undefined,
              flexShrink: undefined,
              width: "max-content",
              "& > div": { padding: 0 },
            }),
            container: (provided) => ({
              ...provided,
              zIndex: 0,
              alignItems: "center",
            }),
            control: (provided) => ({
              ...provided,
              backgroundColor: "transparent",
              border: "0 !important",
              boxShadow: "none !important",
              minHeight: "auto",
              width: "100%",
              flexWrap: undefined,
              "&:hover": {
                border: "0 !important",
              },
            }),
            input: (provided) => ({
              ...provided,
              color: "inherit",
            }),
            option: (provided, state) => ({
              ...provided,
              display: "flex",
              minWidth: "max-content",
              width: "100%",
              backgroundColor: state.isSelected ? "#2c0000" : "transparent",
              color: state.isSelected ? "#ea5757" : "inherit",
              "&:hover": {
                backgroundColor: "#2c0000",
                color: "#ea5757",
              },
            }),
            singleValue: (provided) => ({
              ...provided,
              display: "flex",
              marginLeft: undefined,
              marginRight: undefined,
            }),
            valueContainer: (provided) => ({
              ...provided,
              padding: 0,
              display: "flex",
              flexWrap: undefined,
            }),
            placeholder: (provided) => ({
              ...provided,
              margin: 0,
            }),
            menuPortal: (base) => ({ ...base, zIndex: 999999 }),
            menu: (base) => ({ ...base, minWidth: "max-content", width: "max-content" }),
          }}
          menuPortalTarget={document.body}
          closeMenuOnScroll={(event) => {
            return event.target.id === "scrollContainer";
          }}
          {...restProps}
        />
        {children}
      </>
    );
  }
);

SelectBox.propTypes = {
  className: PropTypes.string,
  options: PropTypes.array,
  isSearchable: PropTypes.bool,
  isMulti: PropTypes.bool,
  onChange: PropTypes.func,
  value: PropTypes.string,
  indicator: PropTypes.node,
  shape: PropTypes.oneOf(["round"]),
  size: PropTypes.oneOf(["xs"]),
  variant: PropTypes.oneOf(["fill", "outline"]),
  color: PropTypes.oneOf(["gray_900", "blue_gray_900"]),
};

export { SelectBox };
