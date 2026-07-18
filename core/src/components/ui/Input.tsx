import React, { forwardRef } from 'react';
import styles from './Input.module.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <div className={styles.wrapper}>
        <input 
          ref={ref}
          className={`${styles.input} ${className}`}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = 'Input';
