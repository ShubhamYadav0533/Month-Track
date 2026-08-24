import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import {
  Clock,
  DollarSign,
  Sparkles,
  Flame,
  AlertCircle,
  Wallet,
  TrendingUp,
  PieChart,
  BarChart3,
  X,
  Trash2,
  CheckCircle2,
  Calendar,
  Receipt,
} from 'lucide-react-native';
import { useFinanceStore } from '../store/useFinanceStore';
import { useAttendanceStore, formatMinutesToHM } from '../store/useAttendanceStore';
import { useProductivityStore } from '../store/useProductivityStore';
import { calculateDailyBudgetStats } from '../utils/budgetCalculator';
import { BillItem, Transaction } from '../types';
import { EnhancedTask } from '../types/productivity';

export function UnifiedDashboard() {
  const { profile, transactions, bills, accounts, toggleBillStatus, deleteBill, deleteTransaction } = useFinanceStore();
  const { employee, shift, todayRecord, getTodayStatus, getLiveWorkingMinutes } = useAttendanceStore();
  const { enhancedTasks, habits, dailyPlanner, toggleTaskComplete, deleteEnhancedTask, toggleHabitForDate } = useProductivityStore();

  const [timeStr, setTimeStr] = useState('');
  const [liveWorkMins, setLiveWorkMins] = useState(0);

  // Detail Modals State
  const [selectedBill, setSelectedBill] = useState<BillItem | null>(null);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [selectedDayData, setSelectedDayData] = useState<{ dayLabel: string; dateStr: string; daySpent: number; txs: Transaction[] } | null>(null);
  const [selectedTask, setSelectedTask] = useState<EnhancedTask | null>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
      setLiveWorkMins(getLiveWorkingMinutes());
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [getLiveWorkingMinutes]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning ☀️';
    if (h < 17) return 'Good Afternoon 🌤️';
    return 'Good Evening 🌙';
  };

  const todayStr = new Date().toISOString().slice(0, 10);
  const formattedDate = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  // Calculate stats
  const todayExpenses = transactions
    .filter((t) => (t.transactionDate || t.expenseDate) === todayStr && t.type === 'Expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const stats = calculateDailyBudgetStats(profile, accounts, transactions);
  const currentMonthStr = todayStr.substring(0, 7);
  const thisMonthExpenses = transactions
    .filter((t) => (t.transactionDate || t.expenseDate || '').substring(0, 7) === currentMonthStr && t.type === 'Expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const monthlyIncome = profile.monthlyIncome || 0;
  const remainingMonthly = Math.max(0, monthlyIncome - thisMonthExpenses);
  const usedPercentage = monthlyIncome > 0 ? Math.min(100, Math.round((thisMonthExpenses / monthlyIncome) * 100)) : 0;

  // Calculate 7 Days Expense Trend Chart Data
  const last7DaysData = Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - idx));
    const dateStr = d.toISOString().slice(0, 10);
    const dayLabel = d.toLocaleDateString(undefined, { weekday: 'short' });
    const dayTxs = transactions.filter((t) => (t.transactionDate || t.expenseDate || '') === dateStr && t.type === 'Expense');
    const daySpent = dayTxs.reduce((sum, t) => sum + t.amount, 0);
    return { dateStr, dayLabel, daySpent, txs: dayTxs };
  });

  const maxSpentIn7Days = Math.max(1, ...last7DaysData.map((d) => d.daySpent));

  const pendingBills = bills.filter((b) => b.status === 'Pending');
  const todayStatus = getTodayStatus();

  const todayTasksList = enhancedTasks.filter((t) => !t.completed);

  const todayHabits = habits.map((h) => ({
    ...h,
    isCompletedToday: h.completedDays.includes(todayStr),
  }));

  const todaySchedule = dailyPlanner.filter(
    (slot) => slot.plannerDate === todayStr || !slot.plannerDate
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greetingText}>{greeting()}</Text>
            <Text style={styles.userName}>{profile.name || employee.fullName || 'User'}</Text>
            <Text style={styles.dateText}>
              {formattedDate} · <Text style={styles.clockText}>{timeStr}</Text>
            </Text>
          </View>
        </View>

        {/* Total Available Liquid Balance Card (Finance Mode) */}
        {(profile.defaultAppMode || 'finance') === 'finance' && (
          <View style={styles.totalBalanceHero}>
            <View style={styles.totalBalanceHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Wallet size={20} color="#10b981" />
                <Text style={styles.totalBalanceLabel}>Total Net Liquid Balance</Text>
              </View>
              <Text style={styles.accountCountText}>{accounts.length} Accounts</Text>
            </View>

            <Text style={styles.totalBalanceVal}>₹{stats.totalMoney.toLocaleString()}</Text>
            <Text style={styles.totalBalanceSub}>
              Bank accounts, UPI & Wallet cash available
            </Text>
          </View>
        )}

        {/* Quick Highlights Banner */}
        <View style={styles.bannerGrid}>
          {/* Today Expenses (Finance Mode) */}
          {(profile.defaultAppMode || 'finance') === 'finance' && (
            <>
              <View style={[styles.bannerCard, { borderLeftColor: '#ef4444' }]}>
                <View style={styles.bannerIconRow}>
                  <DollarSign size={18} color="#ef4444" />
                  <Text style={styles.bannerLabel}>Today Spent</Text>
                </View>
                <Text style={[styles.bannerVal, { color: '#ef4444' }]}>₹{todayExpenses.toLocaleString()}</Text>
                <Text style={styles.bannerSub}>Today's activity</Text>
              </View>

              <View style={[styles.bannerCard, { borderLeftColor: '#f59e0b' }]}>
                <View style={styles.bannerIconRow}>
                  <TrendingUp size={18} color="#f59e0b" />
                  <Text style={styles.bannerLabel}>This Month Spent</Text>
                </View>
                <Text style={[styles.bannerVal, { color: '#f59e0b' }]}>₹{thisMonthExpenses.toLocaleString()}</Text>
                <Text style={styles.bannerSub}>{thisMonthExpenses > 0 ? `${usedPercentage}% of income` : 'No expenses yet'}</Text>
              </View>
            </>
          )}

          {/* Today Attendance (HRMS Mode) */}
          {profile.defaultAppMode === 'hrms' && (
            <View style={[styles.bannerCard, { borderLeftColor: '#10b981' }]}>
              <View style={styles.bannerIconRow}>
                <Clock size={18} color="#10b981" />
                <Text style={styles.bannerLabel}>Attendance</Text>
              </View>
              <Text style={[styles.bannerVal, { color: '#10b981' }]}>{todayStatus}</Text>
              <Text style={styles.bannerSub}>
                {todayRecord ? `Worked ${formatMinutesToHM(liveWorkMins)}` : `${shift.startTime} shift`}
              </Text>
            </View>
          )}
        </View>

        {/* Monthly Budget Tracker (Finance Mode) */}
        {(profile.defaultAppMode || 'finance') === 'finance' && (
          <View style={styles.budgetCard}>
            <View style={styles.budgetCardHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <PieChart size={20} color="#10b981" />
                <Text style={styles.budgetCardTitle}>Monthly Budget & Allowance</Text>
              </View>
              <Text style={[styles.badgeText, { color: usedPercentage > 90 ? '#ef4444' : usedPercentage > 70 ? '#f59e0b' : '#10b981' }]}>
                {usedPercentage}% Used
              </Text>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBg}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${usedPercentage}%`,
                    backgroundColor: usedPercentage > 90 ? '#ef4444' : usedPercentage > 70 ? '#f59e0b' : '#10b981',
                  },
                ]}
              />
            </View>

            <View style={styles.budgetStatsGrid}>
              <View style={styles.budgetItem}>
                <Text style={styles.budgetItemLabel}>Monthly Income</Text>
                <Text style={styles.budgetItemVal}>₹{monthlyIncome.toLocaleString()}</Text>
              </View>

              <View style={styles.budgetItem}>
                <Text style={styles.budgetItemLabel}>Remaining Budget</Text>
                <Text style={[styles.budgetItemVal, { color: '#10b981' }]}>₹{remainingMonthly.toLocaleString()}</Text>
              </View>

              <View style={styles.budgetItem}>
                <Text style={styles.budgetItemLabel}>Daily Safe Spend</Text>
                <Text style={[styles.budgetItemVal, { color: '#3b82f6' }]}>
                  ₹{stats.safeToSpendDaily.toLocaleString()}/day
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Weekly Expense Trend Bar Chart (Finance Mode) */}
        {(profile.defaultAppMode || 'finance') === 'finance' && (
          <View style={styles.chartCard}>
            <View style={styles.chartCardHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <BarChart3 size={20} color="#3b82f6" />
                <Text style={styles.chartCardTitle}>7-Day Expense Trend</Text>
              </View>
              <Text style={styles.chartCardSub}>Tap any bar to view details</Text>
            </View>

            <View style={styles.barChartContainer}>
              {last7DaysData.map((item) => {
                const heightPercent = item.daySpent > 0 ? Math.max(15, Math.round((item.daySpent / maxSpentIn7Days) * 100)) : 6;
                const isToday = item.dateStr === todayStr;
                return (
                  <TouchableOpacity
                    key={item.dateStr}
                    style={styles.barColumn}
                    onPress={() => setSelectedDayData(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.barValText}>
                      {item.daySpent > 0 ? `₹${item.daySpent}` : ''}
                    </Text>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            height: `${heightPercent}%`,
                            backgroundColor: isToday ? '#10b981' : item.daySpent > 0 ? '#ef4444' : '#334155',
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.barDayLabel, isToday && styles.barDayLabelToday]}>
                      {item.dayLabel}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Recent Transactions Section (Finance Mode) */}
        {(profile.defaultAppMode || 'finance') === 'finance' && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>💸 Recent Transactions</Text>
              <Text style={styles.sectionBadge}>{transactions.length} total</Text>
            </View>

            {transactions.length === 0 ? (
              <View style={styles.emptyCard}>
                <Sparkles size={24} color="#94a3b8" />
                <Text style={styles.emptyText}>No transactions recorded yet.</Text>
              </View>
            ) : (
              <View style={styles.txListContainer}>
                {transactions.slice(0, 5).map((tx) => (
                  <TouchableOpacity
                    key={tx.id}
                    style={styles.dashboardTxRow}
                    onPress={() => setSelectedTx(tx)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.txIconBg}>
                      <Receipt size={18} color={tx.type === 'Income' ? '#10b981' : '#ef4444'} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.dashboardTxTitle}>{tx.title}</Text>
                      <Text style={styles.dashboardTxMeta}>
                        {tx.category} · {tx.transactionDate || tx.expenseDate} · {tx.paymentMethod || 'UPI'}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[styles.dashboardTxAmount, { color: tx.type === 'Income' ? '#10b981' : '#f8fafc' }]}>
                        {tx.type === 'Income' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                      </Text>
                      <Text style={styles.clickDetailsText}>Tap for details ›</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}

        {/* Pending Work & Tasks Quick Bar (HRMS Mode) */}
        {profile.defaultAppMode === 'hrms' && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>✅ Today Tasks</Text>
              <Text style={styles.sectionBadge}>{todayTasksList.length} pending</Text>
            </View>
            {todayTasksList.length === 0 ? (
              <View style={styles.emptyCard}>
                <Sparkles size={28} color="#10b981" />
                <Text style={styles.emptyText}>All caught up! No pending tasks.</Text>
              </View>
            ) : (
              <View style={styles.tasksContainer}>
                {todayTasksList.slice(0, 4).map((task) => (
                  <TouchableOpacity
                    key={task.id}
                    style={styles.taskItemRow}
                    onPress={() => setSelectedTask(task)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.priorityDot,
                        {
                          backgroundColor:
                            task.priority === 'Critical'
                              ? '#ef4444'
                              : task.priority === 'High'
                              ? '#f59e0b'
                              : '#3b82f6',
                        },
                      ]}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.taskTitle}>{task.title}</Text>
                      <Text style={styles.taskMeta}>
                        Due: {task.dueDate} {task.dueTime ? `· ${task.dueTime}` : ''}
                      </Text>
                    </View>
                    <View style={styles.taskCategoryBadge}>
                      <Text style={styles.taskCategoryText}>{task.category || 'General'}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Today Schedule Timeline */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>📅 Today Schedule</Text>
            </View>
            <View style={styles.scheduleCard}>
              {todaySchedule.slice(0, 4).map((slot) => (
                <View key={slot.id} style={styles.slotRow}>
                  <Text style={styles.slotTime}>{slot.timeSlot}</Text>
                  <View style={[styles.slotDot, slot.completed && styles.slotDotDone]} />
                  <Text style={[styles.slotActivity, slot.completed && styles.slotActivityDone]}>
                    {slot.activity}
                  </Text>
                </View>
              ))}
            </View>

            {/* Habit Streak Tracker */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🔥 Habit Tracker</Text>
            </View>
            <View style={styles.habitsGrid}>
              {todayHabits.map((habit) => (
                <TouchableOpacity
                  key={habit.id}
                  style={styles.habitCard}
                  onPress={() => toggleHabitForDate(habit.id, todayStr)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.habitIconBg, { backgroundColor: habit.color + '20' }]}>
                    <Flame size={18} color={habit.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.habitTitle}>{habit.title}</Text>
                    <Text style={styles.habitStreak}>{habit.currentStreak} day streak 🔥</Text>
                  </View>
                  <View
                    style={[
                      styles.habitStatusChip,
                      habit.isCompletedToday && { backgroundColor: '#10b981' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.habitStatusText,
                        habit.isCompletedToday && { color: '#ffffff' },
                      ]}
                    >
                      {habit.isCompletedToday ? 'Done ✓' : 'Pending'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Bills & EMI Section (Finance Mode) */}
        {(profile.defaultAppMode || 'finance') === 'finance' && bills.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>💳 Upcoming Bills & EMI</Text>
              <Text style={styles.sectionBadge}>{pendingBills.length} pending</Text>
            </View>
            <View style={styles.billsCard}>
              {bills.map((bill) => (
                <TouchableOpacity
                  key={bill.id}
                  style={styles.billRow}
                  onPress={() => setSelectedBill(bill)}
                  activeOpacity={0.7}
                >
                  <AlertCircle size={18} color={bill.status === 'Paid' ? '#10b981' : '#f59e0b'} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.billTitle}>{bill.title}</Text>
                    <Text style={styles.billDue}>Due: {bill.dueDate} · {bill.category || 'Bill'}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.billAmount, bill.status === 'Paid' && { color: '#10b981' }]}>
                      ₹{bill.amount.toLocaleString()}
                    </Text>
                    <Text style={[styles.billStatusBadge, bill.status === 'Paid' && { color: '#10b981' }]}>
                      {bill.status === 'Paid' ? 'Paid ✓' : 'Tap to Manage/Delete'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* Bill Details & Delete Modal */}
      {selectedBill && (
        <Modal visible={!!selectedBill} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.detailModalContent}>
              <View style={styles.detailModalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <AlertCircle size={22} color="#f59e0b" />
                  <Text style={styles.detailModalTitle}>Bill Details</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedBill(null)} style={styles.closeBtn}>
                  <X size={20} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              <View style={styles.detailBody}>
                <Text style={styles.detailItemTitle}>{selectedBill.title}</Text>
                <Text style={styles.detailAmountText}>₹{selectedBill.amount.toLocaleString()}</Text>

                <View style={styles.detailRowGrid}>
                  <View style={styles.detailCardField}>
                    <Text style={styles.detailFieldLabel}>Due Date</Text>
                    <Text style={styles.detailFieldValue}>{selectedBill.dueDate}</Text>
                  </View>
                  <View style={styles.detailCardField}>
                    <Text style={styles.detailFieldLabel}>Category</Text>
                    <Text style={styles.detailFieldValue}>{selectedBill.category || 'Bills'}</Text>
                  </View>
                  <View style={styles.detailCardField}>
                    <Text style={styles.detailFieldLabel}>Status</Text>
                    <Text style={[styles.detailFieldValue, { color: selectedBill.status === 'Paid' ? '#10b981' : '#f59e0b' }]}>
                      {selectedBill.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.modalActionsRow}>
                  <TouchableOpacity
                    style={[
                      styles.actionBtnPrimary,
                      selectedBill.status === 'Paid' ? { backgroundColor: '#f59e0b' } : { backgroundColor: '#10b981' },
                    ]}
                    onPress={() => {
                      toggleBillStatus(selectedBill.id);
                      setSelectedBill(null);
                    }}
                  >
                    <CheckCircle2 size={18} color="#ffffff" />
                    <Text style={styles.actionBtnText}>
                      {selectedBill.status === 'Paid' ? 'Mark Pending' : 'Mark Paid'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtnDanger}
                    onPress={() => {
                      deleteBill(selectedBill.id);
                      setSelectedBill(null);
                    }}
                  >
                    <Trash2 size={18} color="#ffffff" />
                    <Text style={styles.actionBtnText}>Delete Bill</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Transaction Details & Delete Modal */}
      {selectedTx && (
        <Modal visible={!!selectedTx} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.detailModalContent}>
              <View style={styles.detailModalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Receipt size={22} color="#3b82f6" />
                  <Text style={styles.detailModalTitle}>Transaction Details</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedTx(null)} style={styles.closeBtn}>
                  <X size={20} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              <View style={styles.detailBody}>
                <Text style={styles.detailItemTitle}>{selectedTx.title}</Text>
                <Text style={[styles.detailAmountText, { color: selectedTx.type === 'Income' ? '#10b981' : '#ef4444' }]}>
                  {selectedTx.type === 'Income' ? '+' : '-'}₹{selectedTx.amount.toLocaleString()}
                </Text>

                <View style={styles.detailRowGrid}>
                  <View style={styles.detailCardField}>
                    <Text style={styles.detailFieldLabel}>Type</Text>
                    <Text style={styles.detailFieldValue}>{selectedTx.type}</Text>
                  </View>
                  <View style={styles.detailCardField}>
                    <Text style={styles.detailFieldLabel}>Category</Text>
                    <Text style={styles.detailFieldValue}>{selectedTx.category}</Text>
                  </View>
                  <View style={styles.detailCardField}>
                    <Text style={styles.detailFieldLabel}>Payment Method</Text>
                    <Text style={styles.detailFieldValue}>{selectedTx.paymentMethod || 'UPI'}</Text>
                  </View>
                  <View style={styles.detailCardField}>
                    <Text style={styles.detailFieldLabel}>Date</Text>
                    <Text style={styles.detailFieldValue}>{selectedTx.transactionDate || selectedTx.expenseDate}</Text>
                  </View>
                </View>

                {selectedTx.notes && (
                  <View style={styles.notesBox}>
                    <Text style={styles.notesLabel}>Notes</Text>
                    <Text style={styles.notesText}>{selectedTx.notes}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.actionBtnDanger, { marginTop: 20 }]}
                  onPress={() => {
                    deleteTransaction(selectedTx.id);
                    setSelectedTx(null);
                  }}
                >
                  <Trash2 size={18} color="#ffffff" />
                  <Text style={styles.actionBtnText}>Delete Transaction</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Day Expense Trend Details Modal */}
      {selectedDayData && (
        <Modal visible={!!selectedDayData} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.detailModalContent}>
              <View style={styles.detailModalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Calendar size={22} color="#3b82f6" />
                  <Text style={styles.detailModalTitle}>{selectedDayData.dayLabel} ({selectedDayData.dateStr})</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedDayData(null)} style={styles.closeBtn}>
                  <X size={20} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              <View style={styles.detailBody}>
                <View style={styles.daySummaryBox}>
                  <Text style={styles.daySummaryLabel}>Total Spent On This Day</Text>
                  <Text style={styles.daySummaryVal}>₹{selectedDayData.daySpent.toLocaleString()}</Text>
                </View>

                <Text style={styles.sectionTitleModal}>Day Expenses ({selectedDayData.txs.length})</Text>
                {selectedDayData.txs.length === 0 ? (
                  <Text style={styles.emptyTextModal}>No expenses recorded on this day.</Text>
                ) : (
                  <ScrollView style={{ maxHeight: 220 }}>
                    {selectedDayData.txs.map((tx) => (
                      <TouchableOpacity
                        key={tx.id}
                        style={styles.txRowModal}
                        onPress={() => {
                          setSelectedDayData(null);
                          setSelectedTx(tx);
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.txRowTitle}>{tx.title}</Text>
                          <Text style={styles.txRowSub}>{tx.category} · {tx.paymentMethod}</Text>
                        </View>
                        <Text style={styles.txRowAmount}>₹{tx.amount.toLocaleString()}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Task Details Modal */}
      {selectedTask && (
        <Modal visible={!!selectedTask} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.detailModalContent}>
              <View style={styles.detailModalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <CheckCircle2 size={22} color="#10b981" />
                  <Text style={styles.detailModalTitle}>Task Details</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedTask(null)} style={styles.closeBtn}>
                  <X size={20} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              <View style={styles.detailBody}>
                <Text style={styles.detailItemTitle}>{selectedTask.title}</Text>
                {selectedTask.description && (
                  <Text style={styles.detailDescText}>{selectedTask.description}</Text>
                )}

                <View style={styles.detailRowGrid}>
                  <View style={styles.detailCardField}>
                    <Text style={styles.detailFieldLabel}>Priority</Text>
                    <Text style={styles.detailFieldValue}>{selectedTask.priority}</Text>
                  </View>
                  <View style={styles.detailCardField}>
                    <Text style={styles.detailFieldLabel}>Category</Text>
                    <Text style={styles.detailFieldValue}>{selectedTask.category || 'General'}</Text>
                  </View>
                  <View style={styles.detailCardField}>
                    <Text style={styles.detailFieldLabel}>Due Date</Text>
                    <Text style={styles.detailFieldValue}>{selectedTask.dueDate}</Text>
                  </View>
                </View>

                <View style={styles.modalActionsRow}>
                  <TouchableOpacity
                    style={styles.actionBtnPrimary}
                    onPress={() => {
                      toggleTaskComplete(selectedTask.id);
                      setSelectedTask(null);
                    }}
                  >
                    <CheckCircle2 size={18} color="#ffffff" />
                    <Text style={styles.actionBtnText}>
                      {selectedTask.completed ? 'Mark Pending' : 'Mark Done'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtnDanger}
                    onPress={() => {
                      deleteEnhancedTask(selectedTask.id);
                      setSelectedTask(null);
                    }}
                  >
                    <Trash2 size={18} color="#ffffff" />
                    <Text style={styles.actionBtnText}>Delete Task</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  scroll: { padding: 20, paddingBottom: 40 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greetingText: { fontSize: 13, color: '#94a3b8', fontWeight: '600' },
  userName: { fontSize: 26, color: '#f8fafc', fontWeight: '900', marginTop: 2 },
  dateText: { fontSize: 13, color: '#cbd5e1', marginTop: 4 },
  clockText: { color: '#10b981', fontWeight: '700' },

  bannerGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  bannerCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  bannerIconRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  bannerLabel: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  bannerVal: { fontSize: 20, fontWeight: '900' },
  bannerSub: { color: '#64748b', fontSize: 11, marginTop: 2 },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 4 },
  sectionTitle: { fontSize: 16, color: '#f8fafc', fontWeight: '800' },
  sectionBadge: { fontSize: 12, color: '#10b981', fontWeight: '700' },

  emptyCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 24, alignItems: 'center', gap: 8, marginBottom: 20, borderWidth: 1, borderColor: '#334155' },
  emptyText: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },

  txListContainer: { backgroundColor: '#1e293b', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#334155', gap: 8, marginBottom: 24 },
  dashboardTxRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 8, borderRadius: 12, backgroundColor: '#0f172a' },
  txIconBg: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center' },
  dashboardTxTitle: { color: '#f8fafc', fontSize: 14, fontWeight: '700' },
  dashboardTxMeta: { color: '#94a3b8', fontSize: 11, marginTop: 2 },
  dashboardTxAmount: { fontSize: 14, fontWeight: '800' },
  clickDetailsText: { color: '#3b82f6', fontSize: 10, fontWeight: '600', marginTop: 2 },

  tasksContainer: { backgroundColor: '#1e293b', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#334155', gap: 12, marginBottom: 20 },
  taskItemRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  taskTitle: { color: '#f8fafc', fontSize: 14, fontWeight: '700' },
  taskMeta: { color: '#94a3b8', fontSize: 12 },
  taskCategoryBadge: { backgroundColor: '#0f172a', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  taskCategoryText: { color: '#94a3b8', fontSize: 10, fontWeight: '600' },

  scheduleCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#334155', gap: 12, marginBottom: 20 },
  slotRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  slotTime: { color: '#10b981', fontSize: 12, fontWeight: '700', width: 65 },
  slotDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#334155' },
  slotDotDone: { backgroundColor: '#10b981' },
  slotActivity: { color: '#f8fafc', fontSize: 13, flex: 1 },
  slotActivityDone: { color: '#64748b', textDecorationLine: 'line-through' },

  habitsGrid: { gap: 10, marginBottom: 20 },
  habitCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#334155' },
  habitIconBg: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  habitTitle: { color: '#f8fafc', fontSize: 14, fontWeight: '700' },
  habitStreak: { color: '#94a3b8', fontSize: 12 },
  habitStatusChip: { backgroundColor: '#0f172a', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  habitStatusText: { color: '#94a3b8', fontSize: 11, fontWeight: '700' },

  billsCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#334155', gap: 10, marginBottom: 20 },
  billRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#334155' },
  billTitle: { color: '#f8fafc', fontSize: 14, fontWeight: '700' },
  billDue: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  billAmount: { color: '#f59e0b', fontSize: 14, fontWeight: '800' },
  billStatusBadge: { fontSize: 10, color: '#f59e0b', fontWeight: '600', marginTop: 2 },

  budgetCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 24,
  },
  budgetCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  budgetCardTitle: {
    fontSize: 15,
    color: '#f8fafc',
    fontWeight: '800',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  progressBg: {
    height: 8,
    backgroundColor: '#0f172a',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  budgetStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  budgetItem: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 10,
  },
  budgetItemLabel: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
    marginBottom: 2,
  },
  budgetItemVal: {
    fontSize: 13,
    color: '#f8fafc',
    fontWeight: '800',
  },

  totalBalanceHero: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 20,
  },
  totalBalanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  totalBalanceLabel: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '700',
  },
  accountCountText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '700',
    backgroundColor: '#0f172a',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  totalBalanceVal: {
    fontSize: 32,
    fontWeight: '900',
    color: '#f8fafc',
    letterSpacing: 0.5,
  },
  totalBalanceSub: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 4,
  },

  chartCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 24,
  },
  chartCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartCardTitle: {
    fontSize: 15,
    color: '#f8fafc',
    fontWeight: '800',
  },
  chartCardSub: {
    fontSize: 11,
    color: '#3b82f6',
    fontWeight: '600',
  },
  barChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    paddingTop: 16,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barValText: {
    fontSize: 9,
    color: '#94a3b8',
    fontWeight: '700',
    marginBottom: 4,
  },
  barTrack: {
    width: 14,
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 6,
  },
  barDayLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 6,
  },
  barDayLabelToday: {
    color: '#10b981',
    fontWeight: '800',
  },

  /* Modals */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  detailModalContent: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  detailModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  detailModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f8fafc',
  },
  closeBtn: {
    padding: 4,
  },
  detailBody: {
    gap: 12,
  },
  detailItemTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#f8fafc',
  },
  detailDescText: {
    fontSize: 13,
    color: '#cbd5e1',
    lineHeight: 18,
  },
  detailAmountText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#f59e0b',
  },
  detailRowGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 6,
  },
  detailCardField: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#0f172a',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  detailFieldLabel: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  detailFieldValue: {
    fontSize: 13,
    color: '#f8fafc',
    fontWeight: '700',
    marginTop: 2,
  },
  notesBox: {
    backgroundColor: '#0f172a',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    marginTop: 4,
  },
  notesLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '700',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 13,
    color: '#e2e8f0',
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  actionBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionBtnDanger: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ef4444',
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  daySummaryBox: {
    backgroundColor: '#0f172a',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  daySummaryLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  daySummaryVal: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ef4444',
    marginTop: 2,
  },
  sectionTitleModal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f8fafc',
    marginTop: 8,
  },
  emptyTextModal: {
    fontSize: 13,
    color: '#94a3b8',
    fontStyle: 'italic',
    marginTop: 4,
  },
  txRowModal: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: '#0f172a',
    borderRadius: 10,
    marginBottom: 6,
  },
  txRowTitle: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '700',
  },
  txRowSub: {
    color: '#94a3b8',
    fontSize: 11,
  },
  txRowAmount: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '800',
  },
});

export default UnifiedDashboard;
