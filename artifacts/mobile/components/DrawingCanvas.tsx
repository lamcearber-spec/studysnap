import React, { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Canvas, Path, Skia, SkPath, useCanvasRef } from "@shopify/react-native-skia";
import { GestureHandlerRootView, Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import { C, F } from "@/app/_components/tokens";

const isWeb = Platform.OS === "web";

export type DrawingTool = "pen" | "marker" | "eraser";

export type Stroke = {
  tool: DrawingTool;
  color: string;
  width: number;
  pathData: string;
};

export type DrawingCanvasHandle = {
  clear: () => void;
  undo: () => void;
  redo: () => void;
  getStrokes: () => Stroke[];
  toBase64PNG: () => Promise<string | null>;
};

type DrawingCanvasProps = {
  height?: number;
  initialStrokes?: Stroke[];
  onChange?: (strokes: Stroke[]) => void;
};

const TOOL_PRESETS: Record<DrawingTool, { color: string; width: number }> = {
  pen: { color: C.ink, width: 3 },
  marker: { color: C.primary, width: 8 },
  eraser: { color: "rgba(0,0,0,0)", width: 18 },
};

function pathFromData(data: string): SkPath {
  const path = Skia.Path.MakeFromSVGString(data);
  return path ?? Skia.Path.Make();
}

export const DrawingCanvas = forwardRef<DrawingCanvasHandle, DrawingCanvasProps>(function DrawingCanvas(
  { height = 320, initialStrokes = [], onChange },
  ref,
) {
  const [strokes, setStrokes] = useState<Stroke[]>(initialStrokes);
  const [redoStack, setRedoStack] = useState<Stroke[]>([]);
  const [tool, setTool] = useState<DrawingTool>("pen");
  const canvasRef = useCanvasRef();
  const currentRef = useRef<{ path: SkPath; tool: DrawingTool } | null>(null);
  const [currentPath, setCurrentPath] = useState<SkPath | null>(null);
  const [currentTool, setCurrentTool] = useState<DrawingTool>("pen");

  const commit = useCallback(
    (path: SkPath, t: DrawingTool) => {
      const preset = TOOL_PRESETS[t];
      const stroke: Stroke = {
        tool: t,
        color: preset.color,
        width: preset.width,
        pathData: path.toSVGString(),
      };
      setStrokes((prev) => {
        const next = [...prev, stroke];
        onChange?.(next);
        return next;
      });
      setRedoStack([]);
      setCurrentPath(null);
      currentRef.current = null;
    },
    [onChange],
  );

  const handleStart = useCallback(
    (x: number, y: number) => {
      if (!isWeb) Haptics.selectionAsync();
      const path = Skia.Path.Make();
      path.moveTo(x, y);
      currentRef.current = { path, tool };
      setCurrentTool(tool);
      setCurrentPath(path);
    },
    [tool],
  );

  const handleMove = useCallback((x: number, y: number) => {
    if (!currentRef.current) return;
    currentRef.current.path.lineTo(x, y);
    setCurrentPath(currentRef.current.path.copy());
  }, []);

  const handleEnd = useCallback(() => {
    if (!currentRef.current) return;
    commit(currentRef.current.path, currentRef.current.tool);
  }, [commit]);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .runOnJS(true)
        .minDistance(0)
        .onBegin((e) => handleStart(e.x, e.y))
        .onUpdate((e) => handleMove(e.x, e.y))
        .onEnd(() => handleEnd())
        .onFinalize(() => handleEnd()),
    [handleStart, handleMove, handleEnd],
  );

  const undo = useCallback(() => {
    setStrokes((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      const next = prev.slice(0, -1);
      setRedoStack((rs) => [...rs, last]);
      onChange?.(next);
      return next;
    });
  }, [onChange]);

  const redo = useCallback(() => {
    setRedoStack((rs) => {
      if (rs.length === 0) return rs;
      const last = rs[rs.length - 1];
      setStrokes((prev) => {
        const next = [...prev, last];
        onChange?.(next);
        return next;
      });
      return rs.slice(0, -1);
    });
  }, [onChange]);

  const clear = useCallback(() => {
    setStrokes([]);
    setRedoStack([]);
    onChange?.([]);
  }, [onChange]);

  useImperativeHandle(
    ref,
    () => ({
      clear,
      undo,
      redo,
      getStrokes: () => strokes,
      toBase64PNG: async () => {
        const img = canvasRef.current?.makeImageSnapshot();
        if (!img) return null;
        return img.encodeToBase64();
      },
    }),
    [clear, undo, redo, strokes, canvasRef],
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.toolbar}>
        <ToolButton tool="pen" active={tool === "pen"} onPress={() => setTool("pen")} icon="create-outline" />
        <ToolButton tool="marker" active={tool === "marker"} onPress={() => setTool("marker")} icon="brush-outline" />
        <ToolButton tool="eraser" active={tool === "eraser"} onPress={() => setTool("eraser")} icon="trash-bin-outline" />
        <View style={styles.toolbarSpacer} />
        <ActionButton disabled={strokes.length === 0} onPress={undo} icon="arrow-undo" />
        <ActionButton disabled={redoStack.length === 0} onPress={redo} icon="arrow-redo" />
      </View>
      <GestureHandlerRootView style={[styles.canvasWrap, { height }]}>
        <GestureDetector gesture={pan}>
          <Canvas ref={canvasRef} style={{ flex: 1 }}>
            {strokes.map((s, i) => (
              <Path
                key={i}
                path={pathFromData(s.pathData)}
                color={s.tool === "eraser" ? "#FFFFFF" : s.color}
                style="stroke"
                strokeWidth={s.width}
                strokeCap="round"
                strokeJoin="round"
                blendMode={s.tool === "eraser" ? "clear" : undefined}
                opacity={s.tool === "marker" ? 0.45 : 1}
              />
            ))}
            {currentPath && (
              <Path
                path={currentPath}
                color={currentTool === "eraser" ? "#FFFFFF" : TOOL_PRESETS[currentTool].color}
                style="stroke"
                strokeWidth={TOOL_PRESETS[currentTool].width}
                strokeCap="round"
                strokeJoin="round"
                blendMode={currentTool === "eraser" ? "clear" : undefined}
                opacity={currentTool === "marker" ? 0.45 : 1}
              />
            )}
          </Canvas>
        </GestureDetector>
      </GestureHandlerRootView>
    </View>
  );
});

function ToolButton({
  active,
  onPress,
  icon,
  tool,
}: {
  active: boolean;
  onPress: () => void;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  tool: DrawingTool;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.tool, active && styles.toolActive]}
      accessibilityRole="button"
      accessibilityLabel={tool}
      accessibilityState={{ selected: active }}
    >
      <Ionicons name={icon} size={20} color={active ? "#FFFFFF" : C.inkBody} />
    </Pressable>
  );
}

function ActionButton({
  disabled,
  onPress,
  icon,
}: {
  disabled: boolean;
  onPress: () => void;
  icon: React.ComponentProps<typeof Ionicons>["name"];
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.action, disabled && styles.actionDisabled]}
      accessibilityRole="button"
    >
      <Ionicons name={icon} size={18} color={disabled ? C.inkMuted : C.inkBody} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  toolbarSpacer: {
    flex: 1,
  },
  tool: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.hairline,
    backgroundColor: C.card,
    alignItems: "center",
    justifyContent: "center",
  },
  toolActive: {
    backgroundColor: C.primary,
    borderColor: C.primaryDark,
  },
  action: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.hairline,
    backgroundColor: C.card,
    alignItems: "center",
    justifyContent: "center",
  },
  actionDisabled: {
    opacity: 0.4,
  },
  canvasWrap: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.hairline,
    backgroundColor: C.card,
    overflow: "hidden",
  },
});

export default DrawingCanvas;
