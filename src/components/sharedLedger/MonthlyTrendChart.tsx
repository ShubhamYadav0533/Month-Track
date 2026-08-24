import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MonthlyChartDataPoint } from '../../types/sharedLedger';
import { TrendingUp, BarChart2, DollarSign } from 'lucide-react-native';

interface MonthlyTrendChartProps {
  dataPoints: MonthlyChartDataPoint[];
}

type ViewMode = 'expenses' | 'comparison' | 'net';

export function MonthlyTrendChart({ dataPoints }: MonthlyTrendChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('expenses');
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(
    dataPoints.length > 0 ? dataPoints.length - 1 : null
  );

  if (!dataPoints || dataPoints.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No monthly graph data recorded yet.</Text>
      </View>
    );
  }

  const selectedPoint =
    selectedPointIndex !== null && dataPoints[selectedPointIndex]
      ? dataPoints[selectedPointIndex]
      : dataPoints[dataPoints.length - 1];

  // Compute maximum values for scaling bar heights
  const maxExpense = Math.max(...dataPoints.map((d) => d.totalExpenses), 1000);
  const maxPaidOrShare = Math.max(
    ...dataPoints.map((d) => Math.max(d.myPaidAmount, d.myShare)),
    1000
  );
  const maxNetAbs = Math.max(
    ...dataPoints.map((d) => Math.abs(d.netPosition)),
    1000
  );

  const chartHeight = 160;

  return (
    <View style={styles.container}>
      {/* Chart Header & Controls */}
      <View style={styles.chartHeader}>
        <View>
          <Text style={styles.chartTitle}>Monthly Auto-Calculated Analytics</Text>
          <Text style={styles.chartSubtitle}>
            {viewMode === 'expenses'
              ? 'Group Total Expenses Trend'
              : viewMode === 'comparison'
              ? 'My Paid Amount vs My Share'
              : 'My Net Settlement Position Trajectory'}
          </Text>
        </View>

        {/* View Mode Toggle Buttons */}
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'expenses' && styles.toggleBtnActive]}
            onPress={() => setViewMode('expenses')}
          >
            <BarChart2 size={14} color={viewMode === 'expenses' ? '#ffffff' : '#94a3b8'} />
            <Text style={[styles.toggleText, viewMode === 'expenses' && styles.toggleTextActive]}>
              Expenses
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'comparison' && styles.toggleBtnActive]}
            onPress={() => setViewMode('comparison')}
          >
            <DollarSign size={14} color={viewMode === 'comparison' ? '#ffffff' : '#94a3b8'} />
            <Text style={[styles.toggleText, viewMode === 'comparison' && styles.toggleTextActive]}>
              Paid vs Share
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'net' && styles.toggleBtnActive]}
            onPress={() => setViewMode('net')}
          >
            <TrendingUp size={14} color={viewMode === 'net' ? '#ffffff' : '#94a3b8'} />
            <Text style={[styles.toggleText, viewMode === 'net' && styles.toggleTextActive]}>
              Net Position
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Selected Month Tooltip Banner */}
      {selectedPoint && (
        <View style={styles.tooltipBanner}>
          <Text style={styles.tooltipMonth}>{selectedPoint.month}</Text>
          <View style={styles.tooltipMetricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Total Group Exp</Text>
              <Text style={styles.metricValue}>₹{selectedPoint.totalExpenses.toLocaleString()}</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>My Paid Amount</Text>
              <Text style={[styles.metricValue, { color: '#10b981' }]}>
                ₹{selectedPoint.myPaidAmount.toLocaleString()}
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>My Share</Text>
              <Text style={[styles.metricValue, { color: '#f59e0b' }]}>
                ₹{selectedPoint.myShare.toLocaleString()}
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Net Position</Text>
              <Text
                style={[
                  styles.metricValue,
                  { color: selectedPoint.netPosition >= 0 ? '#10b981' : '#f43f5e' },
                ]}
              >
                {selectedPoint.netPosition >= 0 ? '+' : ''}₹
                {selectedPoint.netPosition.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Interactive Bar Chart Visualization */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.barScrollContent}>
        <View style={[styles.chartBody, { height: chartHeight }]}>
          {dataPoints.map((dp, idx) => {
            const isSelected = selectedPointIndex === idx;

            if (viewMode === 'expenses') {
              const barH = Math.max(12, (dp.totalExpenses / maxExpense) * (chartHeight - 30));
              return (
                <TouchableOpacity
                  key={dp.monthKey || idx}
                  style={styles.columnContainer}
                  onPress={() => setSelectedPointIndex(idx)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.columnTopValue}>₹{Math.round(dp.totalExpenses / 1000)}k</Text>
                  <View
                    style={[
                      styles.singleBar,
                      { height: barH, backgroundColor: isSelected ? '#3b82f6' : '#1e3a8a' },
                    ]}
                  />
                  <Text style={[styles.monthLabel, isSelected && styles.monthLabelActive]}>
                    {dp.month.slice(0, 3)}
                  </Text>
                </TouchableOpacity>
              );
            }

            if (viewMode === 'comparison') {
              const paidH = Math.max(8, (dp.myPaidAmount / maxPaidOrShare) * (chartHeight - 30));
              const shareH = Math.max(8, (dp.myShare / maxPaidOrShare) * (chartHeight - 30));
              return (
                <TouchableOpacity
                  key={dp.monthKey || idx}
                  style={styles.columnContainer}
                  onPress={() => setSelectedPointIndex(idx)}
                  activeOpacity={0.8}
                >
                  <View style={styles.dualBarRow}>
                    <View style={[styles.dualBar, { height: paidH, backgroundColor: '#10b981' }]} />
                    <View style={[styles.dualBar, { height: shareH, backgroundColor: '#f59e0b' }]} />
                  </View>
                  <Text style={[styles.monthLabel, isSelected && styles.monthLabelActive]}>
                    {dp.month.slice(0, 3)}
                  </Text>
                </TouchableOpacity>
              );
            }

            // viewMode === 'net'
            const netVal = dp.netPosition;
            const isPositive = netVal >= 0;
            const barH = Math.max(10, (Math.abs(netVal) / maxNetAbs) * ((chartHeight - 40) / 2));

            return (
              <TouchableOpacity
                key={dp.monthKey || idx}
                style={styles.columnContainer}
                onPress={() => setSelectedPointIndex(idx)}
                activeOpacity={0.8}
              >
                <View style={styles.netBarContainer}>
                  <Text style={[styles.columnTopValue, { color: isPositive ? '#10b981' : '#f43f5e' }]}>
                    {isPositive ? '+' : ''}{Math.round(netVal)}
                  </Text>
                  <View
                    style={[
                      styles.singleBar,
                      {
                        height: barH,
                        backgroundColor: isPositive ? '#10b981' : '#f43f5e',
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.monthLabel, isSelected && styles.monthLabelActive]}>
                  {dp.month.slice(0, 3)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Legend Footer */}
      <View style={styles.legendRow}>
        {viewMode === 'expenses' && (
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#3b82f6' }]} />
            <Text style={styles.legendText}>Monthly Expense Volume</Text>
          </View>
        )}
        {viewMode === 'comparison' && (
          <>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
              <Text style={styles.legendText}>My Actual Paid</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
              <Text style={styles.legendText}>My Share Responsibility</Text>
            </View>
          </>
        )}
        {viewMode === 'net' && (
          <>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
              <Text style={styles.legendText}>Net Creditor (+)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#f43f5e' }]} />
              <Text style={styles.legendText}>Net Debtor (-)</Text>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 20,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 20,
  },
  chartHeader: {
    flexDirection: 'column',
    gap: 10,
    marginBottom: 14,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  chartSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 3,
    gap: 4,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    borderRadius: 8,
  },
  toggleBtnActive: {
    backgroundColor: '#3b82f6',
  },
  toggleText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
  },
  toggleTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  tooltipBanner: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  tooltipMonth: {
    fontSize: 12,
    fontWeight: '700',
    color: '#60a5fa',
    marginBottom: 6,
  },
  tooltipMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricItem: {
    alignItems: 'flex-start',
  },
  metricLabel: {
    fontSize: 10,
    color: '#94a3b8',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  barScrollContent: {
    paddingHorizontal: 8,
  },
  chartBody: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 18,
    paddingBottom: 6,
  },
  columnContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: 44,
  },
  columnTopValue: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: 4,
  },
  singleBar: {
    width: 22,
    borderRadius: 6,
  },
  dualBarRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  dualBar: {
    width: 10,
    borderRadius: 4,
  },
  netBarContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  monthLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 8,
  },
  monthLabelActive: {
    color: '#10b981',
    fontWeight: '800',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: '#94a3b8',
  },
});
