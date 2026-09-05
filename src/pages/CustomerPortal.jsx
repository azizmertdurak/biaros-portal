import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  Building2, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  CreditCard, 
  Receipt, 
  ShieldAlert,
  Calendar,
  FileText
} from 'lucide-react';

export default function CustomerPortal() {
  const { customerId } = useParams();

  const [customer, setCustomer] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [stats, setStats] = useState({
    totalPaidAmount: 0,
    totalPendingAmount: 0,
    totalOverdueAmount: 0,
    totalCount: 0,
    paidCount: 0,
    pendingCount: 0,
    overdueCount: 0,
    currency: 'TRY'
  });

  const fetchData = useCallback(async () => {
    if (!customerId) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    try {
      // 1. Fetch customer details
      const { data: custData, error: custErr } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single();

      if (custErr || !custData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setCustomer(custData);
      setNotFound(false);

      // 2. Fetch payments sorted by date desc
      const { data: payData, error: payErr } = await supabase
        .from('payments')
        .select('*')
        .eq('customer_id', customerId)
        .order('date', { ascending: false });

      if (payErr) {
        console.error('Error fetching payments:', payErr);
      } else {
        const pList = payData || [];
        setPayments(pList);
        calculateStats(pList, custData.currency || 'TRY');
      }
    } catch (err) {
      console.error('Portal data error:', err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  function calculateStats(pList, defaultCurrency) {
    const today = new Date().toISOString().split('T')[0];

    let paidAmt = 0;
    let pendingAmt = 0;
    let overdueAmt = 0;
    let paidC = 0;
    let pendingC = 0;
    let overdueC = 0;

    pList.forEach(p => {
      const amt = Number(p.amount) || 0;
      const effectiveStatus = p.status === 'pending' && p.due_date && p.due_date < today 
        ? 'overdue' 
        : p.status;

      if (effectiveStatus === 'paid') {
        paidAmt += amt;
        paidC++;
      } else if (effectiveStatus === 'pending') {
        pendingAmt += amt;
        pendingC++;
      } else if (effectiveStatus === 'overdue') {
        overdueAmt += amt;
        overdueC++;
      }
    });

    setStats({
      totalPaidAmount: paidAmt,
      totalPendingAmount: pendingAmt,
      totalOverdueAmount: overdueAmt,
      totalCount: pList.length,
      paidCount: paidC,
      pendingCount: pendingC,
      overdueCount: overdueC,
      currency: defaultCurrency
    });
  }

  useEffect(() => {
    fetchData();

    // Setup real-time listener for updates to this customer's payments
    if (customerId) {
      const channel = supabase
        .channel(`public:payments:${customerId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'payments',
            filter: `customer_id=eq.${customerId}`
          },
          () => {
            fetchData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [customerId, fetchData]);

  const formatCurrency = (val, currency = stats.currency) => {
    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(val) + ' ' + (currency || 'TRY');
  };

  const getStatusBadge = (item) => {
    const today = new Date().toISOString().split('T')[0];
    const effectiveStatus = item.status === 'pending' && item.due_date && item.due_date < today 
      ? 'overdue' 
      : item.status;

    if (effectiveStatus === 'paid') {
      return (
        <span className="status-pill paid">
          <CheckCircle2 size={14} /> Ödendi
        </span>
      );
    } else if (effectiveStatus === 'pending') {
      return (
        <span className="status-pill pending">
          <Clock size={14} /> Bekliyor
        </span>
      );
    } else {
      return (
        <span className="status-pill overdue">
          <AlertTriangle size={14} /> Gecikti
        </span>
      );
    }
  };

  if (loading) {
    return (
      <div className="loading-wrapper">
        <div className="spinner"></div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Müşteri Portalı Yükleniyor...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="portal-container">
        <div className="glass-card error-card">
          <div className="error-icon">
            <ShieldAlert size={36} />
          </div>
          <h1 className="error-title">Müşteri Bulunamadı</h1>
          <p className="error-desc">
            Geçersiz veya süresi dolmuş bir müşteri portalı bağlantısı kullandınız. Lütfen firma yetkilisi ile iletişime geçiniz.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="portal-container">
      {/* Background ambient lighting */}
      <div className="bg-ambient">
        <div className="ambient-orb orb-1"></div>
        <div className="ambient-orb orb-2"></div>
      </div>

      {/* Header */}
      <header className="portal-header">
        <div className="brand-section">
          <div className="brand-logo">
            <Receipt size={24} />
          </div>
          <div>
            <div className="brand-title">BiaFinance</div>
            <div className="brand-subtitle">Müşteri Ödeme Portalı</div>
          </div>
        </div>

        <div className="customer-badge">
          <div className="customer-name">{customer?.name}</div>
          {customer?.contact_name && (
            <div className="customer-contact">Yetkili: {customer.contact_name}</div>
          )}
        </div>
      </header>

      {/* Main Hero Stats Card */}
      <div className="glass-card hero-stat-card">
        <div className="stat-label">
          <TrendingUp size={16} color="var(--primary-green)" />
          Toplam Ödediğiniz Tutar
        </div>
        <div className="hero-amount">
          {formatCurrency(stats.totalPaidAmount, customer?.currency)}
        </div>
        <div className="hero-subtext">
          Sistem kayıtlarına göre onaylanmış toplam başarılı ödeme tutarınızdır.
        </div>
      </div>

      {/* Summary Breakdown Grid */}
      <div className="summary-grid">
        <div className="summary-card total">
          <div className="summary-title">Toplam İşlem Sayısı</div>
          <div className="summary-value total">{stats.totalCount} Adet</div>
        </div>

        <div className="summary-card paid">
          <div className="summary-title">Ödenen Tutar</div>
          <div className="summary-value paid">
            {formatCurrency(stats.totalPaidAmount, customer?.currency)}
          </div>
        </div>

        <div className="summary-card pending">
          <div className="summary-title">Bekleyen Tutar (Vade)</div>
          <div className="summary-value pending">
            {formatCurrency(stats.totalPendingAmount, customer?.currency)}
          </div>
        </div>

        <div className="summary-card overdue">
          <div className="summary-title">Geciken Tutar</div>
          <div className="summary-value overdue">
            {formatCurrency(stats.totalOverdueAmount, customer?.currency)}
          </div>
        </div>
      </div>

      {/* Payment History Table Section */}
      <div className="glass-card">
        <div className="section-header">
          <h2 className="section-title">
            <CreditCard size={20} color="var(--primary-green)" />
            Ödeme Geçmişi
          </h2>
          <div className="live-indicator">
            <div className="live-dot"></div>
            Canlı Takip
          </div>
        </div>

        {payments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
            Henüz kayıtlı bir ödeme geçmişiniz bulunmamaktadır.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="payments-table">
              <thead>
                <tr>
                  <th>Tarih</th>
                  <th>Tutar</th>
                  <th>Para Birimi</th>
                  <th>Durum</th>
                  <th>Not</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Calendar size={14} color="var(--text-secondary)" />
                        {p.date}
                      </div>
                    </td>
                    <td className="amount-col">
                      {Number(p.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </td>
                    <td>{p.currency || customer?.currency || 'TRY'}</td>
                    <td>{getStatusBadge(p)}</td>
                    <td style={{ color: p.note ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      {p.note || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <footer className="footer-credits">
        © {new Date().getFullYear()} BiaFinance Muhasebe & Finans Portalı. Tüm hakları saklıdır.
      </footer>
    </div>
  );
}
