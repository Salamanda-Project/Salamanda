import React from "react";
import SwitchProvider from "@dhiwise/react-switch";
import PropTypes from "prop-types";

const variants = {
  swtFillGray900: {
    offColor: "#141414",
    onColor: "#2c0000",
    offHandleColor: "#0a0a0a",
    onHandleColor: "#0a0a0a",
  },
};

const sizes = {
  xs: {
    width: 48,
    height: 24,
  },
};

const Switch = ({
  value = false,
  className,
  checkedIcon = <></>,
  uncheckedIcon = <></>,
  onChange,
  variant = "swtFillGray900",
  size = "xs",
}) => {
  const [selected, setSelected] = React.useState(value);

  const handleChange = (val) => {
    setSelected(val);
    onChange?.(val);
  };

  return (
    <div className={className}>
      <SwitchProvider
        checked={selected}
        onChange={handleChange}
        {...variants[variant]}
        {...sizes[size]}
        checkedIcon={checkedIcon}
        uncheckedIcon={uncheckedIcon}
      />
    </div>
  );
};

Switch.propTypes = {
  value: PropTypes.bool,
  className: PropTypes.string,
  checkedIcon: PropTypes.node,
  uncheckedIcon: PropTypes.node,
  onChange: PropTypes.func,
  size: PropTypes.oneOf(["xs"]),
  variant: PropTypes.oneOf(["swtFillGray900"]),
};

export { Switch };
