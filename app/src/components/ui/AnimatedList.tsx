import React, { useRef, useEffect } from "react";
import { Animated, FlatListProps, FlatList } from "react-native";

type AnimatedListItemProps = {
  children: React.ReactNode;
  index: number;
  delay?: number;
};

export function AnimatedListItem({ children, index, delay = 0 }: AnimatedListItemProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 350,
        delay: 50 * index + delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 350,
        delay: 50 * index + delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

type AnimatedListProps<T> = FlatListProps<T> & {
  // TODO: implement or remove
};

export function AnimatedList<T>({ ...props }: AnimatedListProps<T>) {
  return (
    <FlatList
      {...props}
      removeClippedSubviews={false}
    />
  );
}
