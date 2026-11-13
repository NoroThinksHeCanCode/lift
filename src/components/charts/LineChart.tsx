import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, Line } from 'react-native-svg';
import { THEME } from '../../constants/theme';

interface LineChartPoint {
  xLabel: string;
  value: number;
}

interface LineChartProps {
  data: LineChartPoint[];
  title?: string;
  unit?: string;
  strokeColor?: string;
  height?: number;
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  title,
  unit = 'lbs',
  strokeColor = THEME.colors.primary,
  height = 180
}) => {
  if (!data || data.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        {title && <Text style={styles.chartTitle}>{title}</Text>}
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>No workout history for this exercise yet.</Text>
        </View>
      </View>
    );
  }

  const values = data.map(d => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const paddingY = 24;
  const paddingX = 30;
  const chartWidth = 320; // rendered svg base width
  const chartHeight = height - 50;

  const range = maxVal - minVal === 0 ? 1 : maxVal - minVal;

  const points = data.map((d, index) => {
    const x = paddingX + (index / (Math.max(1, data.length - 1))) * (chartWidth - paddingX * 2);
    const y = chartHeight - paddingY - ((d.value - minVal) / range) * (chartHeight - paddingY * 2);
    return { x, y, value: d.value, label: d.xLabel };
  });

  // Construct SVG Path
  let pathD = '';
  let areaD = '';

  if (points.length === 1) {
    pathD = `M ${points[0].x - 10} ${points[0].y} L ${points[0].x + 10} ${points[0].y}`;
  } else {
    pathD = points.reduce((acc, p, idx) => {
      return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, '');

    // Area under path
    const lastP = points[points.length - 1];
    const firstP = points[0];
    areaD = `${pathD} L ${lastP.x} ${chartHeight - 8} L ${firstP.x} ${chartHeight - 8} Z`;
  }

  return (
    <View style={styles.container}>
      {title && (
        <View style={styles.titleRow}>
          <Text style={styles.chartTitle}>{title}</Text>
          <Text style={styles.maxBadge}>
            Peak: {maxVal} {unit}
          </Text>
        </View>
      )}

      <Svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
        <Defs>
          <LinearGradient id="gradientArea" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={strokeColor} stopOpacity="0.35" />
            <Stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
          </LinearGradient>
        </Defs>

        {/* Horizontal grid lines */}
        <Line
          x1={paddingX}
          y1={paddingY}
          x2={chartWidth - paddingX}
          y2={paddingY}
          stroke={THEME.colors.border}
          strokeDasharray="4 4"
          strokeWidth="1"
        />
        <Line
          x1={paddingX}
          y1={chartHeight / 2}
          x2={chartWidth - paddingX}
          y2={chartHeight / 2}
          stroke={THEME.colors.border}
          strokeDasharray="4 4"
          strokeWidth="1"
        />
        <Line
          x1={paddingX}
          y1={chartHeight - paddingY}
          x2={chartWidth - paddingX}
          y2={chartHeight - paddingY}
          stroke={THEME.colors.border}
          strokeWidth="1"
        />

        {/* Fill area */}
        {areaD ? <Path d={areaD} fill="url(#gradientArea)" /> : null}

        {/* Stroke Line */}
        <Path d={pathD} fill="none" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" />

        {/* Points & Dots */}
        {points.map((p, idx) => (
          <Circle
            key={idx}
            cx={p.x}
            cy={p.y}
            r="4.5"
            fill={strokeColor}
            stroke={THEME.colors.surface}
            strokeWidth="2"
          />
        ))}
      </Svg>

      {/* X Labels */}
      <View style={styles.labelsRow}>
        {data.length <= 5 ? (
          data.map((d, i) => (
            <Text key={i} style={styles.xLabel}>
              {d.xLabel}
            </Text>
          ))
        ) : (
          <>
            <Text style={styles.xLabel}>{data[0].xLabel}</Text>
            <Text style={styles.xLabel}>{data[Math.floor(data.length / 2)].xLabel}</Text>
            <Text style={styles.xLabel}>{data[data.length - 1].xLabel}</Text>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.colors.border
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  chartTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.colors.textMuted,
    letterSpacing: 0.8
  },
  maxBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.primary
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingHorizontal: 8
  },
  xLabel: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    fontWeight: '600'
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyText: {
    color: THEME.colors.textMuted,
    fontSize: 13,
    fontStyle: 'italic'
  }
});
