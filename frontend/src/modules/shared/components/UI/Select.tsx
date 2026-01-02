import { forwardRef, SelectHTMLAttributes } from 'react';

type Props = SelectHTMLAttributes<HTMLSelectElement>;

const Select = forwardRef<HTMLSelectElement, Props>(
  ({ className = '', ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={`input ${className}`}
        {...props}
      />
    );
  }
);

Select.displayName = 'Select';

export default Select;
