import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';
import { THEME } from '../../constants/theme';

interface VolumeBarProps {
  data: { weekLabel: string; totalVolume: number; workoutsCount: number }[];
  unit?: string;
  height?: number;
}

export const VolumeBarChart: React.FC<VolumeBarProps> = ({
  data,
  unit = 'lbs',
  height = 180
}) => {
  if (!data || data.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        <Text style={styles.chartTitle}>WEEKLY VOLUME (TONNAGE)</Text>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>No workout volume recorded yet.</Text>
        </View>
      </View>
    );
  }

  const maxVolume = Math.max(...data.map(d => d.totalVolume), 100);
  const chartWidth = 320;
  const chartHeight = height - 40;
  const paddingBottom = 26;
  const availableHeight = chartHeight - paddingBottom - 10;
  const barWidth = 26;
  const totalBars = data.length;
  const spacing = (chartWidth - 40) / totalBars;

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={styles.chartTitle}>WEEKLY VOLUME TRENDS</Text>
        <Text style={styles.maxBadge}>
          Max: {maxVolume > 1000 ? `${(maxVolume / 1000).toFixed(1)}k` : maxVolume} {unit}
        </Text>
      </View>

      <Svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
        {/* Baseline grid line */}
        <Line
          x1={10}
          y1={chartHeight - paddingBottom}
          x2={chartWidth - 10}
          y2={chartHeight - paddingBottom}
          stroke={THEME.colors.border}
          strokeWidth="1"
        />

        {data.map((item, idx) => {
          const barHeight = item.totalVolume > 0
            ? Math.max(6, (item.totalVolume / maxVolume) * availableHeight)
            : 4;
          const x = 20 + idx * spacing + (spacing - barWidth) / 2;
          const y = chartHeight - paddingBottom - barHeight;

          const isCurrentWeek = idx === data.length - 1;
          const barColor = isCurrentWeek
            ? THEME.colors.primary
            : item.totalVolume > 0
            ? THEME.colors.cyan
            : THEME.colors.surfaceHighlight;

          return (
            <React.Fragment key={idx}>
              {/* Bar */}
              <Rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={4}
                fill={barColor}
              />

              {/* Volume value tag above bar */}
              {item.totalVolume > 0 && (
                <SvgText
                  x={x + barWidth / 2}
                  y={y - 4}
                  fill={THEME.colors.textSecondary}
                  fontSize="9"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {item.totalVolume > 999 ? `${Math.round(item.totalVolume / 1000)}k` : item.totalVolume}
                </SvgText>
              )}

              {/* X Label */}
              <SvgText
                x={x + barWidth / 2}
                y={chartHeight - 8}
                fill={isCurrentWeek ? THEME.colors.primary : THEME.colors.textMuted}
                fontSize="10"
                fontWeight={isCurrentWeek ? 'bold' : 'normal'}
                textAnchor="middle"
              >
                {item.weekLabel}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
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
    color: THEME.colors.cyan
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
