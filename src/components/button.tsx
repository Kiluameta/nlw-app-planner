import { createContext, useContext } from "react";

import clsx from "clsx";
import {
  ActivityIndicator,
  Text,
  TextProps,
  TouchableOpacity,
  TouchableOpacityProps,
} from "react-native";

type Variants = "primary" | "secondary";

type ButtonProps = TouchableOpacityProps & {
  variant?: Variants;
  isLoading?: boolean;
};

const ThemeContext = createContext<{ variant?: Variants }>({});

function Button({
  isLoading = false,
  variant = "primary",
  disabled,
  children,
  ...rest
}: ButtonProps) {
  return (
    <TouchableOpacity
      className={clsx(
        "w-full h-11 flex-row rounded-lg items-center justify-center gap-2 bg-lime-300",
        { "bg-zinc-800": variant === "secondary" },
        { "opacity-60": disabled }
      )}
      activeOpacity={0.7}
      disabled={isLoading || disabled}
      {...rest}
    >
      <ThemeContext.Provider value={{ variant }}>
        {isLoading ? <ActivityIndicator className="text-lime-950" /> : children}
      </ThemeContext.Provider>
    </TouchableOpacity>
  );
}

function Title({ children }: TextProps) {
  const { variant } = useContext(ThemeContext);
  return (
    <Text
      className={clsx("text-base font-semibold text-lime-950", {
        "text-zinc-200": variant === "secondary",
      })}
    >
      {children}
    </Text>
  );
}

Button.Title = Title;

export { Button };
