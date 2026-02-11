import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Edit2, Trash2, X, Save, ArrowRight, Clock, MapPin, FileText, Moon, Sun, Sunset, Calendar, Check, AlertCircle, User } from 'lucide-react';
import { shiftService } from '../services/shiftService';

// Modern Color Palette - More vibrant and friendly
const COLORS = {
  primary: '#4A90E2',
  primaryLight: '#6BA3E8',
  primaryDark: '#3A7BC8',
  secondary: '#FF6B9D',
  accent: '#FFB74D',
  success: '#66BB6A',
  warning: '#FFA726',
  danger: '#EF5350',
  purple: '#9575CD',
  teal: '#4DB6AC',
  
  // Shift colors
  dayShift: '#FFB74D',
  nightShift: '#9575CD',
  twilightShift: '#FF6B9D',
  shortShift: '#4DB6AC',
  
  // Leave colors
  sickLeave: '#EF5350',
  annualLeave: '#66BB6A',
  training: '#4A90E2',
  preceptorship: '#9575CD',
  
  // UI colors
  background: '#F5F7FA',
  cardBg: '#FFFFFF',
  textDark: '#2C3E50',
  textMuted: '#7F8C8D',
  border: '#E1E8ED',
  shadow: 'rgba(0, 0, 0, 0.08)',
  gradient1: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  gradient2: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  gradient3: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  gradient4: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
};

const NHSShiftTracker = () => {
  const [currentView, setCurrentView] = useState('month');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState(null);
  const [shifts, setShifts] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('shift');
  const [editingShift, setEditingShift] = useState(null);
  const [transferMode, setTransferMode] = useState(false);
  const [transferSource, setTransferSource] = useState(null);

  useEffect(() => {
    const loadShifts = async () => {
      try {
        const result = await shiftService.getAllShifts();
        if (result.success && result.data) {
          setShifts(result.data);
        }
      } catch (error) {
        console.error('Error loading shifts:', error);
      }
    };
    
    loadShifts();

    const unsubscribe = shiftService.subscribeToShifts((updatedShifts) => {
      setShifts(updatedShifts);
    });

    return () => unsubscribe();
  }, []);

  const saveShift = async (dateStr, shiftData) => {
    try {
      const result = await shiftService.saveShift(dateStr, shiftData);
      if (result.success) {
        console.log('Shift saved successfully');
      } else {
        console.error('Error saving shift:', result.error);
        alert('Failed to save shift. Please try again.');
      }
    } catch (error) {
      console.error('Error saving shift:', error);
      alert('Failed to save shift. Please try again.');
    }
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();
  const formatDate = (year, month, day) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const getShiftForDate = (dateStr) => shifts[dateStr] || null;

  const parseDateString = (dateStr) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return { year, month: month - 1, day };
  };

  const addOrUpdateShift = async (dateStr, shiftData) => {
    await saveShift(dateStr, shiftData);
  };

  const deleteShift = async (dateStr) => {
    try {
      const result = await shiftService.deleteShift(dateStr);
      if (result.success) {
        console.log('Shift deleted successfully');
      } else {
        console.error('Error deleting shift:', result.error);
        alert('Failed to delete shift. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting shift:', error);
      alert('Failed to delete shift. Please try again.');
    }
  };

  const transferShift = async (fromDate, toDate, newShiftData = null) => {
    try {
      if (newShiftData) {
        await saveShift(toDate, newShiftData);
        await deleteShift(fromDate);
      } else {
        const result = await shiftService.transferShift(fromDate, toDate);
        if (!result.success) {
          console.error('Error transferring shift:', result.error);
          alert('Failed to transfer shift. Please try again.');
          return;
        }
      }
      console.log('Shift transferred successfully');
      setTransferMode(false);
      setTransferSource(null);
    } catch (error) {
      console.error('Error transferring shift:', error);
      alert('Failed to transfer shift. Please try again.');
    }
  };

  const getShiftColor = (shift) => {
    if (!shift) return 'transparent';
    if (shift.type === 'leave') {
      switch (shift.leaveType) {
        case 'sick': return COLORS.sickLeave;
        case 'annual': return COLORS.annualLeave;
        case 'training': return COLORS.training;
        case 'preceptorship': return COLORS.preceptorship;
        default: return COLORS.textMuted;
      }
    }
    if (shift.isShortShift) return COLORS.shortShift;
    switch (shift.shiftType) {
      case 'day': return COLORS.dayShift;
      case 'night': return COLORS.nightShift;
      case 'twilight': return COLORS.twilightShift;
      default: return COLORS.primary;
    }
  };

  const ShiftIcon = ({ type, size = 20 }) => {
    const iconProps = { size, strokeWidth: 2.5 };
    switch (type) {
      case 'day': return <Sun {...iconProps} />;
      case 'night': return <Moon {...iconProps} />;
      case 'twilight': return <Sunset {...iconProps} />;
      default: return <Clock {...iconProps} />;
    }
  };

  const getShiftLabel = (shift) => {
    if (!shift) return '';
    if (shift.type === 'leave') {
      const labels = {
        sick: 'Sick',
        annual: 'Annual',
        training: 'Training',
        preceptorship: 'Precept'
      };
      return labels[shift.leaveType] || 'Leave';
    }
    const typeLabel = shift.shiftType.charAt(0).toUpperCase() + shift.shiftType.slice(1);
    return shift.isShortShift ? `Short ${typeLabel}` : typeLabel;
  };

  // Modern Header Component
  const Header = () => {
    const today = new Date();
    const greeting = today.getHours() < 12 ? 'Good Morning' : today.getHours() < 18 ? 'Good Afternoon' : 'Good Evening';
    
    return (
      <div style={{
        background: COLORS.gradient1,
        borderRadius: '0 0 32px 32px',
        padding: 'clamp(24px, 6vw, 32px) clamp(16px, 4vw, 24px)',
        marginBottom: 'clamp(16px, 4vw, 24px)',
        boxShadow: `0 8px 24px ${COLORS.shadow}`,
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative circles */}
        <div style={{
          position: 'absolute',
          top: '-40px',
          right: '-40px',
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-20px',
          left: '20px',
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
        }} />
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div>
              <div style={{
                fontSize: 'clamp(24px, 6vw, 32px)',
                fontWeight: '700',
                color: '#FFFFFF',
                marginBottom: '4px',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              }}>
                {greeting}!
              </div>
              <div style={{
                fontSize: 'clamp(14px, 3.5vw, 16px)',
                color: 'rgba(255,255,255,0.9)',
                fontWeight: '500'
              }}>
                {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </div>
            </div>
            <div style={{
              width: 'clamp(40px, 10vw, 48px)',
              height: 'clamp(40px, 10vw, 48px)',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              border: '2px solid rgba(255,255,255,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF'
            }}>
              <User size={window.innerWidth < 400 ? 20 : 24} />
            </div>
          </div>
          
          {transferMode && (
            <div style={{
              marginTop: '16px',
              padding: '12px 16px',
              background: 'rgba(255,255,255,0.15)',
              borderRadius: '16px',
              border: '1px solid rgba(255,255,255,0.2)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ArrowRight size={18} color="#FFFFFF" />
                <span style={{ color: '#FFFFFF', fontSize: '14px', fontWeight: '500' }}>
                  Select destination date
                </span>
              </div>
              <button
                onClick={() => {
                  setTransferMode(false);
                  setTransferSource(null);
                }}
                style={{
                  padding: '6px 12px',
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Statistics Component - Colorful Cards
  const Statistics = () => {
    const thisMonth = Object.entries(shifts).filter(([dateStr]) => {
      const { year, month } = parseDateString(dateStr);
      return month === selectedMonth && year === selectedYear;
    });

    const dayShifts = thisMonth.filter(([, s]) => s.type !== 'leave' && s.shiftType === 'day').length;
    const nightShifts = thisMonth.filter(([, s]) => s.type !== 'leave' && s.shiftType === 'night').length;
    const twilightShifts = thisMonth.filter(([, s]) => s.type !== 'leave' && s.shiftType === 'twilight').length;
    const leaves = thisMonth.filter(([, s]) => s.type === 'leave').length;
    const totalShifts = dayShifts + nightShifts + twilightShifts;

    const stats = [
      { label: 'Day Shifts', value: dayShifts, gradient: COLORS.gradient4, icon: 'day' },
      { label: 'Night Shifts', value: nightShifts, gradient: COLORS.gradient1, icon: 'night' },
      { label: 'Leave Days', value: leaves, gradient: COLORS.gradient2, icon: 'annual' },
      { label: 'Total', value: totalShifts, gradient: COLORS.gradient3, icon: 'day' }
    ];

    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 'clamp(10px, 2.5vw, 16px)',
        marginBottom: 'clamp(16px, 4vw, 24px)',
        padding: '0 clamp(16px, 4vw, 24px)'
      }}>
        {stats.map((stat, idx) => (
          <div
            key={idx}
            style={{
              background: stat.gradient,
              borderRadius: '20px',
              padding: 'clamp(16px, 4vw, 20px)',
              boxShadow: `0 4px 16px ${COLORS.shadow}`,
              transition: 'all 0.3s ease',
              cursor: 'default',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            {/* Decorative circle */}
            <div style={{
              position: 'absolute',
              top: '-20px',
              right: '-20px',
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)'
            }} />
            
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{
                width: 'clamp(36px, 9vw, 44px)',
                height: 'clamp(36px, 9vw, 44px)',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 'clamp(8px, 2vw, 12px)',
                color: '#FFFFFF'
              }}>
                <ShiftIcon type={stat.icon} size={window.innerWidth < 400 ? 18 : 22} />
              </div>
              <div style={{
                fontSize: 'clamp(28px, 7vw, 36px)',
                fontWeight: '700',
                color: '#FFFFFF',
                marginBottom: '4px',
                fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
              }}>
                {stat.value}
              </div>
              <div style={{
                fontSize: 'clamp(12px, 3vw, 13px)',
                color: 'rgba(255,255,255,0.95)',
                fontWeight: '600',
                letterSpacing: '0.3px'
              }}>
                {stat.label}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Month Navigation
  const MonthNavigation = () => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 clamp(16px, 4vw, 24px)',
      marginBottom: 'clamp(16px, 4vw, 20px)'
    }}>
      <button
        onClick={() => {
          if (selectedMonth === 0) {
            setSelectedMonth(11);
            setSelectedYear(selectedYear - 1);
          } else {
            setSelectedMonth(selectedMonth - 1);
          }
        }}
        style={{
          width: 'clamp(40px, 10vw, 48px)',
          height: 'clamp(40px, 10vw, 48px)',
          background: COLORS.cardBg,
          border: `2px solid ${COLORS.border}`,
          borderRadius: '50%',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 2px 8px ${COLORS.shadow}`,
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = COLORS.primary;
          e.currentTarget.style.borderColor = COLORS.primary;
          e.currentTarget.querySelector('svg').style.color = '#FFFFFF';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = COLORS.cardBg;
          e.currentTarget.style.borderColor = COLORS.border;
          e.currentTarget.querySelector('svg').style.color = COLORS.textDark;
        }}
      >
        <ChevronLeft size={window.innerWidth < 400 ? 20 : 24} color={COLORS.textDark} />
      </button>

      <div style={{
        fontSize: 'clamp(18px, 4.5vw, 22px)',
        fontWeight: '700',
        color: COLORS.textDark,
        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
      }}>
        {months[selectedMonth]} {selectedYear}
      </div>

      <button
        onClick={() => {
          if (selectedMonth === 11) {
            setSelectedMonth(0);
            setSelectedYear(selectedYear + 1);
          } else {
            setSelectedMonth(selectedMonth + 1);
          }
        }}
        style={{
          width: 'clamp(40px, 10vw, 48px)',
          height: 'clamp(40px, 10vw, 48px)',
          background: COLORS.cardBg,
          border: `2px solid ${COLORS.border}`,
          borderRadius: '50%',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 2px 8px ${COLORS.shadow}`,
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = COLORS.primary;
          e.currentTarget.style.borderColor = COLORS.primary;
          e.currentTarget.querySelector('svg').style.color = '#FFFFFF';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = COLORS.cardBg;
          e.currentTarget.style.borderColor = COLORS.border;
          e.currentTarget.querySelector('svg').style.color = COLORS.textDark;
        }}
      >
        <ChevronRight size={window.innerWidth < 400 ? 20 : 24} color={COLORS.textDark} />
      </button>
    </div>
  );

  // Calendar View - Modern Design
  const MonthView = () => {
    const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
    const firstDay = getFirstDayOfMonth(selectedYear, selectedMonth);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div 
          key={`empty-${i}`} 
          style={{ 
            minHeight: 'clamp(60px, 14vw, 75px)',
            aspectRatio: '1'
          }} 
        />
      );
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = formatDate(selectedYear, selectedMonth, day);
      const shift = getShiftForDate(dateStr);
      const isToday = new Date().toDateString() === new Date(selectedYear, selectedMonth, day).toDateString();

      days.push(
        <div
          key={day}
          onClick={() => {
            if (transferMode && transferSource) {
              if (transferSource !== dateStr) {
                const sourceShift = getShiftForDate(transferSource);
                setEditingShift({
                  date: dateStr,
                  transferFrom: transferSource,
                  ...sourceShift
                });
                setModalType(sourceShift.type);
                setShowModal(true);
              }
            } else {
              setSelectedDate(dateStr);
              setCurrentView('day');
            }
          }}
          style={{
            padding: 'clamp(6px, 1.5vw, 10px)',
            background: shift ? getShiftColor(shift) : COLORS.cardBg,
            borderRadius: '16px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            border: isToday ? `3px solid ${COLORS.primary}` : `1px solid ${shift ? 'transparent' : COLORS.border}`,
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: shift ? `0 4px 12px ${getShiftColor(shift)}40` : `0 2px 8px ${COLORS.shadow}`,
            minHeight: 'clamp(60px, 14vw, 75px)',
            aspectRatio: '1',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = shift ? `0 8px 20px ${getShiftColor(shift)}50` : `0 6px 16px ${COLORS.shadow}`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = shift ? `0 4px 12px ${getShiftColor(shift)}40` : `0 2px 8px ${COLORS.shadow}`;
          }}
        >
          <div style={{
            fontSize: 'clamp(13px, 3.2vw, 16px)',
            fontWeight: '700',
            color: shift ? '#FFFFFF' : isToday ? COLORS.primary : COLORS.textDark,
            textAlign: 'left'
          }}>
            {day}
          </div>
          {shift && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              marginTop: 'auto'
            }}>
              <div style={{
                background: 'rgba(255,255,255,0.3)',
                borderRadius: '8px',
                padding: '4px 6px',
                display: 'flex',
                alignItems: 'center',
                gap: '3px'
              }}>
                <ShiftIcon type={shift.type === 'leave' ? 'leave' : shift.shiftType} size={window.innerWidth < 400 ? 12 : 14} />
                <span style={{
                  fontSize: 'clamp(9px, 2.2vw, 11px)',
                  color: '#FFFFFF',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.3px'
                }}>
                  {getShiftLabel(shift).substring(0, 4)}
                </span>
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div style={{ padding: '0 clamp(16px, 4vw, 24px)' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 'clamp(4px, 1vw, 8px)',
          marginBottom: 'clamp(8px, 2vw, 12px)'
        }}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
            <div key={idx} style={{
              textAlign: 'center',
              fontSize: 'clamp(11px, 2.8vw, 13px)',
              fontWeight: '700',
              color: COLORS.textMuted,
              padding: 'clamp(6px, 1.5vw, 8px)',
              letterSpacing: '0.5px'
            }}>
              {day}
            </div>
          ))}
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 'clamp(4px, 1vw, 8px)',
          width: '100%'
        }}>
          {days}
        </div>
      </div>
    );
  };

  // Day View - Modern Card Layout
  const DayView = () => {
    if (!selectedDate) return null;

    const shift = getShiftForDate(selectedDate);
    const { year, month, day } = parseDateString(selectedDate);
    const displayDate = new Date(year, month, day);

    return (
      <div style={{ padding: '0 clamp(16px, 4vw, 24px)' }}>
        <button
          onClick={() => {
            setCurrentView('month');
            setSelectedDate(null);
          }}
          style={{
            marginBottom: 'clamp(16px, 4vw, 20px)',
            padding: '12px 20px',
            background: COLORS.cardBg,
            color: COLORS.primary,
            border: `2px solid ${COLORS.border}`,
            borderRadius: '16px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: 'clamp(14px, 3.5vw, 15px)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
            boxShadow: `0 2px 8px ${COLORS.shadow}`
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = COLORS.primary;
            e.currentTarget.style.color = '#FFFFFF';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = COLORS.cardBg;
            e.currentTarget.style.color = COLORS.primary;
          }}
        >
          <ChevronLeft size={18} />
          Back to Calendar
        </button>

        <div style={{
          fontSize: 'clamp(20px, 5vw, 24px)',
          fontWeight: '700',
          color: COLORS.textDark,
          marginBottom: 'clamp(16px, 4vw, 24px)',
          fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
        }}>
          {displayDate.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>

        {shift ? (
          <div>
            <div style={{
              background: getShiftColor(shift),
              borderRadius: '24px',
              padding: 'clamp(20px, 5vw, 28px)',
              marginBottom: 'clamp(16px, 4vw, 20px)',
              boxShadow: `0 8px 24px ${getShiftColor(shift)}40`,
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Decorative circles */}
              <div style={{
                position: 'absolute',
                top: '-30px',
                right: '-30px',
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.15)'
              }} />
              
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(12px, 3vw, 16px)', marginBottom: 'clamp(16px, 4vw, 20px)' }}>
                  <div style={{
                    width: 'clamp(56px, 14vw, 64px)',
                    height: 'clamp(56px, 14vw, 64px)',
                    borderRadius: '18px',
                    background: 'rgba(255,255,255,0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    flexShrink: 0
                  }}>
                    <ShiftIcon type={shift.type === 'leave' ? 'leave' : shift.shiftType} size={window.innerWidth < 400 ? 28 : 32} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 'clamp(20px, 5vw, 24px)',
                      fontWeight: '700',
                      color: '#FFFFFF',
                      marginBottom: '4px'
                    }}>
                      {getShiftLabel(shift)}
                    </div>
                    {shift.eventName && (
                      <div style={{
                        fontSize: 'clamp(13px, 3.2vw, 14px)',
                        color: 'rgba(255,255,255,0.9)',
                        fontWeight: '500',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {shift.eventName}
                      </div>
                    )}
                  </div>
                </div>

                {(shift.time || shift.location || shift.notes) && (
                  <div style={{
                    background: 'rgba(255,255,255,0.15)',
                    borderRadius: '16px',
                    padding: 'clamp(12px, 3vw, 16px)',
                    backdropFilter: 'blur(10px)'
                  }}>
                    {shift.time && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        marginBottom: shift.location || shift.notes ? '12px' : '0',
                        color: '#FFFFFF'
                      }}>
                        <Clock size={16} style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: 'clamp(13px, 3.2vw, 14px)', fontWeight: '500' }}>{shift.time}</span>
                      </div>
                    )}

                    {shift.location && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        marginBottom: shift.notes ? '12px' : '0',
                        color: '#FFFFFF'
                      }}>
                        <MapPin size={16} style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: 'clamp(13px, 3.2vw, 14px)', fontWeight: '500' }}>{shift.location}</span>
                      </div>
                    )}

                    {shift.notes && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        color: '#FFFFFF'
                      }}>
                        <FileText size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
                        <span style={{ fontSize: 'clamp(13px, 3.2vw, 14px)', fontWeight: '500', flex: 1, lineHeight: '1.5' }}>{shift.notes}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 'clamp(10px, 2.5vw, 12px)' }}>
              <button
                onClick={() => {
                  setEditingShift({ date: selectedDate, ...shift });
                  setModalType(shift.type);
                  setShowModal(true);
                }}
                style={{
                  padding: 'clamp(14px, 3.5vw, 16px)',
                  background: COLORS.gradient3,
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  fontWeight: '700',
                  fontSize: 'clamp(14px, 3.5vw, 15px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: `0 4px 12px ${COLORS.shadow}`,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <Edit2 size={16} />
                Edit
              </button>

              <button
                onClick={() => {
                  setTransferMode(true);
                  setTransferSource(selectedDate);
                  setCurrentView('month');
                }}
                style={{
                  padding: 'clamp(14px, 3.5vw, 16px)',
                  background: COLORS.gradient4,
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  fontWeight: '700',
                  fontSize: 'clamp(14px, 3.5vw, 15px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: `0 4px 12px ${COLORS.shadow}`,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <ArrowRight size={16} />
                Transfer
              </button>

              <button
                onClick={async () => {
                  if (window.confirm('Are you sure you want to delete this shift?')) {
                    await deleteShift(selectedDate);
                    setCurrentView('month');
                    setSelectedDate(null);
                  }
                }}
                style={{
                  padding: 'clamp(14px, 3.5vw, 16px)',
                  background: COLORS.gradient2,
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  fontWeight: '700',
                  fontSize: 'clamp(14px, 3.5vw, 15px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: `0 4px 12px ${COLORS.shadow}`,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </div>
        ) : (
          <div style={{
            background: COLORS.cardBg,
            borderRadius: '24px',
            padding: 'clamp(32px, 8vw, 48px) clamp(20px, 5vw, 24px)',
            textAlign: 'center',
            boxShadow: `0 4px 16px ${COLORS.shadow}`
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: `${COLORS.primary}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: COLORS.primary
            }}>
              <Calendar size={32} />
            </div>
            <div style={{
              fontSize: 'clamp(15px, 3.8vw, 17px)',
              color: COLORS.textMuted,
              marginBottom: 'clamp(20px, 5vw, 24px)',
              fontWeight: '500'
            }}>
              No shift scheduled for this day
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 'clamp(10px, 2.5vw, 12px)' }}>
              <button
                onClick={() => {
                  setModalType('shift');
                  setEditingShift({ date: selectedDate });
                  setShowModal(true);
                }}
                style={{
                  padding: 'clamp(14px, 3.5vw, 16px)',
                  background: COLORS.gradient3,
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  fontWeight: '700',
                  fontSize: 'clamp(14px, 3.5vw, 15px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: `0 4px 12px ${COLORS.shadow}`,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <Plus size={18} />
                Add Shift
              </button>

              <button
                onClick={() => {
                  setModalType('leave');
                  setEditingShift({ date: selectedDate });
                  setShowModal(true);
                }}
                style={{
                  padding: 'clamp(14px, 3.5vw, 16px)',
                  background: COLORS.gradient4,
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  fontWeight: '700',
                  fontSize: 'clamp(14px, 3.5vw, 15px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: `0 4px 12px ${COLORS.shadow}`,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <Plus size={18} />
                Add Leave
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Modern Modal - Bottom Sheet on Mobile
  const Modal = () => {
    const isTransfer = editingShift?.transferFrom;
    
    const [formData, setFormData] = useState(() => {
      if (editingShift) {
        return {
          type: editingShift.type || modalType,
          shiftType: editingShift.shiftType || 'day',
          leaveType: editingShift.leaveType || 'annual',
          isShortShift: editingShift.isShortShift || false,
          time: editingShift.time || '',
          location: editingShift.location || '',
          notes: editingShift.notes || '',
          eventName: editingShift.eventName || '',
          date: editingShift.date || ''
        };
      }
      return {
        type: modalType,
        shiftType: 'day',
        leaveType: 'annual',
        isShortShift: false,
        time: '',
        location: '',
        notes: '',
        eventName: '',
        date: ''
      };
    });

    const handleSubmit = async (e) => {
      e.preventDefault();
      
      if (!formData.date) {
        alert('Please select a date');
        return;
      }

      const shiftData = {
        type: formData.type,
        ...(formData.type === 'shift' ? {
          shiftType: formData.shiftType,
          isShortShift: formData.isShortShift
        } : {
          leaveType: formData.leaveType,
          ...(formData.eventName && { eventName: formData.eventName })
        }),
        ...(formData.time && { time: formData.time }),
        ...(formData.location && { location: formData.location }),
        ...(formData.notes && { notes: formData.notes })
      };

      if (isTransfer) {
        await transferShift(editingShift.transferFrom, formData.date, shiftData);
      } else {
        await addOrUpdateShift(formData.date, shiftData);
      }
      
      setShowModal(false);
      setEditingShift(null);
      if (currentView === 'day') {
        setCurrentView('month');
      }
    };

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: window.innerWidth < 600 ? 'flex-end' : 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: window.innerWidth < 600 ? '0' : '16px',
        backdropFilter: 'blur(8px)',
        overflowY: 'auto'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setShowModal(false);
          setEditingShift(null);
        }
      }}>
        <div style={{
          background: COLORS.cardBg,
          borderRadius: window.innerWidth < 600 ? '32px 32px 0 0' : '32px',
          padding: 'clamp(24px, 6vw, 32px)',
          maxWidth: '500px',
          width: '100%',
          maxHeight: window.innerWidth < 600 ? '92vh' : '90vh',
          overflowY: 'auto',
          boxShadow: `0 20px 60px rgba(0,0,0,0.3)`,
          animation: window.innerWidth < 600 ? 'modalSlideUp 0.3s ease-out' : 'modalSlideIn 0.3s ease-out'
        }}>
          {/* Modal Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'clamp(20px, 5vw, 24px)'
          }}>
            <div>
              <h2 style={{
                fontSize: 'clamp(22px, 5.5vw, 26px)',
                fontWeight: '700',
                color: COLORS.textDark,
                margin: '0 0 4px 0',
                fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
              }}>
                {isTransfer ? 'Transfer' : editingShift?.date && !isTransfer ? 'Edit' : 'Add'} {modalType === 'shift' ? 'Shift' : 'Leave'}
              </h2>
              {isTransfer && (
                <div style={{
                  fontSize: 'clamp(12px, 3vw, 13px)',
                  color: COLORS.textMuted,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  marginTop: '4px'
                }}>
                  <AlertCircle size={14} />
                  You can modify details during transfer
                </div>
              )}
            </div>
            <button
              onClick={() => {
                setShowModal(false);
                setEditingShift(null);
              }}
              style={{
                width: '40px',
                height: '40px',
                background: `${COLORS.border}`,
                border: 'none',
                cursor: 'pointer',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                flexShrink: 0
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = `${COLORS.danger}20`}
              onMouseLeave={(e) => e.currentTarget.style.background = COLORS.border}
            >
              <X size={20} color={COLORS.textDark} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Date Input */}
            <div style={{ marginBottom: 'clamp(16px, 4vw, 20px)' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: 'clamp(13px, 3.2vw, 14px)',
                fontWeight: '700',
                color: COLORS.textDark,
                letterSpacing: '0.3px'
              }}>
                Date *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: 'clamp(14px, 3.5vw, 16px)',
                  borderRadius: '16px',
                  border: `2px solid ${COLORS.border}`,
                  fontSize: 'clamp(14px, 3.5vw, 15px)',
                  transition: 'all 0.2s ease',
                  fontFamily: 'inherit',
                  background: COLORS.cardBg,
                  color: COLORS.textDark,
                  fontWeight: '500'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = COLORS.primary;
                  e.currentTarget.style.boxShadow = `0 0 0 4px ${COLORS.primary}15`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = COLORS.border;
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            {modalType === 'shift' ? (
              <>
                {/* Shift Type */}
                <div style={{ marginBottom: 'clamp(16px, 4vw, 20px)' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '12px',
                    fontSize: 'clamp(13px, 3.2vw, 14px)',
                    fontWeight: '700',
                    color: COLORS.textDark,
                    letterSpacing: '0.3px'
                  }}>
                    Shift Type *
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                    {[
                      { value: 'day', label: 'Day', color: COLORS.dayShift },
                      { value: 'night', label: 'Night', color: COLORS.nightShift },
                      { value: 'twilight', label: 'Twilight', color: COLORS.twilightShift }
                    ].map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, shiftType: type.value })}
                        style={{
                          padding: 'clamp(14px, 3.5vw, 16px)',
                          background: formData.shiftType === type.value ? type.color : COLORS.cardBg,
                          color: formData.shiftType === type.value ? '#FFFFFF' : COLORS.textDark,
                          border: `2px solid ${formData.shiftType === type.value ? type.color : COLORS.border}`,
                          borderRadius: '16px',
                          cursor: 'pointer',
                          fontWeight: '700',
                          fontSize: 'clamp(13px, 3.2vw, 14px)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '8px',
                          transition: 'all 0.2s ease',
                          boxShadow: formData.shiftType === type.value ? `0 4px 12px ${type.color}40` : 'none'
                        }}
                      >
                        <ShiftIcon type={type.value} size={20} />
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Short Shift Toggle */}
                <div style={{ marginBottom: 'clamp(16px, 4vw, 20px)' }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    padding: '16px',
                    borderRadius: '16px',
                    background: formData.isShortShift ? `${COLORS.shortShift}15` : `${COLORS.border}80`,
                    border: `2px solid ${formData.isShortShift ? COLORS.shortShift : 'transparent'}`,
                    transition: 'all 0.2s ease'
                  }}>
                    <input
                      type="checkbox"
                      checked={formData.isShortShift}
                      onChange={(e) => setFormData({ ...formData, isShortShift: e.target.checked })}
                      style={{
                        width: '22px',
                        height: '22px',
                        cursor: 'pointer',
                        accentColor: COLORS.shortShift,
                        flexShrink: 0
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <span style={{
                        fontSize: 'clamp(14px, 3.5vw, 15px)',
                        fontWeight: '700',
                        color: COLORS.textDark,
                        display: 'block',
                        marginBottom: '2px'
                      }}>
                        Short Shift
                      </span>
                      <span style={{
                        fontSize: 'clamp(12px, 3vw, 13px)',
                        color: COLORS.textMuted,
                        fontWeight: '500'
                      }}>
                        Mark as a shorter than normal shift
                      </span>
                    </div>
                  </label>
                </div>
              </>
            ) : (
              <>
                {/* Leave Type */}
                <div style={{ marginBottom: 'clamp(16px, 4vw, 20px)' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '12px',
                    fontSize: 'clamp(13px, 3.2vw, 14px)',
                    fontWeight: '700',
                    color: COLORS.textDark,
                    letterSpacing: '0.3px'
                  }}>
                    Leave Type *
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                    {[
                      { value: 'annual', label: 'Annual Leave', color: COLORS.annualLeave },
                      { value: 'sick', label: 'Sick Leave', color: COLORS.sickLeave },
                      { value: 'training', label: 'Training', color: COLORS.training },
                      { value: 'preceptorship', label: 'Preceptorship', color: COLORS.preceptorship }
                    ].map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, leaveType: type.value })}
                        style={{
                          padding: 'clamp(14px, 3.5vw, 16px)',
                          background: formData.leaveType === type.value ? type.color : COLORS.cardBg,
                          color: formData.leaveType === type.value ? '#FFFFFF' : COLORS.textDark,
                          border: `2px solid ${formData.leaveType === type.value ? type.color : COLORS.border}`,
                          borderRadius: '16px',
                          cursor: 'pointer',
                          fontWeight: '700',
                          fontSize: 'clamp(13px, 3.2vw, 14px)',
                          transition: 'all 0.2s ease',
                          boxShadow: formData.leaveType === type.value ? `0 4px 12px ${type.color}40` : 'none'
                        }}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Event Name */}
                <div style={{ marginBottom: 'clamp(16px, 4vw, 20px)' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: 'clamp(13px, 3.2vw, 14px)',
                    fontWeight: '700',
                    color: COLORS.textDark,
                    letterSpacing: '0.3px'
                  }}>
                    Event/Course Name
                  </label>
                  <input
                    type="text"
                    value={formData.eventName}
                    onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                    placeholder="e.g., Advanced Life Support Course"
                    style={{
                      width: '100%',
                      padding: 'clamp(14px, 3.5vw, 16px)',
                      borderRadius: '16px',
                      border: `2px solid ${COLORS.border}`,
                      fontSize: 'clamp(14px, 3.5vw, 15px)',
                      transition: 'all 0.2s ease',
                      fontFamily: 'inherit'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = COLORS.primary;
                      e.currentTarget.style.boxShadow = `0 0 0 4px ${COLORS.primary}15`;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = COLORS.border;
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </>
            )}

            {/* Time */}
            <div style={{ marginBottom: 'clamp(16px, 4vw, 20px)' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: 'clamp(13px, 3.2vw, 14px)',
                fontWeight: '700',
                color: COLORS.textDark,
                letterSpacing: '0.3px'
              }}>
                Time
              </label>
              <input
                type="text"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                placeholder="e.g., 07:00 - 19:00"
                style={{
                  width: '100%',
                  padding: 'clamp(14px, 3.5vw, 16px)',
                  borderRadius: '16px',
                  border: `2px solid ${COLORS.border}`,
                  fontSize: 'clamp(14px, 3.5vw, 15px)',
                  transition: 'all 0.2s ease',
                  fontFamily: 'inherit'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = COLORS.primary;
                  e.currentTarget.style.boxShadow = `0 0 0 4px ${COLORS.primary}15`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = COLORS.border;
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Location */}
            <div style={{ marginBottom: 'clamp(16px, 4vw, 20px)' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: 'clamp(13px, 3.2vw, 14px)',
                fontWeight: '700',
                color: COLORS.textDark,
                letterSpacing: '0.3px'
              }}>
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Ward A3, Main Hospital"
                style={{
                  width: '100%',
                  padding: 'clamp(14px, 3.5vw, 16px)',
                  borderRadius: '16px',
                  border: `2px solid ${COLORS.border}`,
                  fontSize: 'clamp(14px, 3.5vw, 15px)',
                  transition: 'all 0.2s ease',
                  fontFamily: 'inherit'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = COLORS.primary;
                  e.currentTarget.style.boxShadow = `0 0 0 4px ${COLORS.primary}15`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = COLORS.border;
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Notes */}
            <div style={{ marginBottom: 'clamp(20px, 5vw, 24px)' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: 'clamp(13px, 3.2vw, 14px)',
                fontWeight: '700',
                color: COLORS.textDark,
                letterSpacing: '0.3px'
              }}>
                Additional Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add any additional notes or reminders..."
                rows={3}
                style={{
                  width: '100%',
                  padding: 'clamp(14px, 3.5vw, 16px)',
                  borderRadius: '16px',
                  border: `2px solid ${COLORS.border}`,
                  fontSize: 'clamp(14px, 3.5vw, 15px)',
                  transition: 'all 0.2s ease',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  lineHeight: '1.5'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = COLORS.primary;
                  e.currentTarget.style.boxShadow = `0 0 0 4px ${COLORS.primary}15`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = COLORS.border;
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Action Buttons */}
            <button
              type="submit"
              style={{
                width: '100%',
                padding: 'clamp(16px, 4vw, 18px)',
                background: COLORS.gradient3,
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '16px',
                cursor: 'pointer',
                fontWeight: '700',
                fontSize: 'clamp(15px, 3.8vw, 16px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                boxShadow: `0 8px 24px ${COLORS.primary}30`,
                letterSpacing: '0.3px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = `0 12px 32px ${COLORS.primary}40`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = `0 8px 24px ${COLORS.primary}30`;
              }}
            >
              <Save size={18} />
              {isTransfer ? 'Transfer Shift' : 'Save Shift'}
            </button>
          </form>
        </div>
      </div>
    );
  };

  // Floating Action Buttons
  const FloatingActions = () => (
    <div style={{
      position: 'fixed',
      bottom: 'clamp(20px, 5vw, 24px)',
      right: 'clamp(20px, 5vw, 24px)',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      zIndex: 100
    }}>
      <button
        onClick={() => {
          setModalType('shift');
          setEditingShift(null);
          setShowModal(true);
        }}
        style={{
          width: '56px',
          height: '56px',
          background: COLORS.gradient3,
          border: 'none',
          borderRadius: '50%',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 8px 24px ${COLORS.primary}40`,
          transition: 'all 0.3s ease',
          color: '#FFFFFF'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1) rotate(90deg)';
          e.currentTarget.style.boxShadow = `0 12px 32px ${COLORS.primary}50`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
          e.currentTarget.style.boxShadow = `0 8px 24px ${COLORS.primary}40`;
        }}
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: COLORS.background,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      overflowX: 'hidden',
      paddingBottom: 'clamp(80px, 20vw, 100px)'
    }}>
      <style>{`
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes modalSlideUp {
          from {
            opacity: 0;
            transform: translateY(100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        * {
          box-sizing: border-box;
        }
        
        body {
          overflow-x: hidden;
        }
      `}</style>
      
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <Header />
        
        {currentView === 'month' && (
          <>
            <Statistics />
            <MonthNavigation />
            <MonthView />
            {!transferMode && <FloatingActions />}
          </>
        )}
        
        {currentView === 'day' && <DayView />}
      </div>

      {showModal && <Modal />}
    </div>
  );
};

export default NHSShiftTracker;