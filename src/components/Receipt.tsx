import React from 'react';
import { IonIcon } from '@ionic/react';
import { printOutline } from 'ionicons/icons';

export interface ReceiptData {
  bookingId: string;
  customerName: string;
  phone: string;
  listingName: string;
  date: string;
  adults: number | null;
  kids: number | null;
  cottage?: { name: string; price: number } | null;
  total: number;
  amountPaid: number;
  balance: number;
  paymentMethod: string;
  paymentType: string;
  referenceNo: string;
  dateCreated: string;
}

interface Props {
  data: ReceiptData;
}

const Receipt: React.FC<Props> = ({ data }) => {
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Resort Booking Receipt</title>
          <style>
            body { font-family: 'Courier New', monospace; padding: 40px; max-width: 400px; margin: 0 auto; color: #333; }
            .header { text-align: center; border-bottom: 2px dashed #0b4b5e; padding-bottom: 16px; margin-bottom: 16px; }
            .header h1 { margin: 0; font-size: 1.4rem; color: #0b4b5e; }
            .header p { margin: 4px 0; font-size: 0.85rem; }
            .section { margin-bottom: 12px; }
            .row { display: flex; justify-content: space-between; font-size: 0.9rem; padding: 4px 0; }
            .row strong { font-weight: 700; }
            .divider { border-top: 1px dashed #ccc; margin: 12px 0; }
            .total { font-size: 1.1rem; font-weight: bold; color: #0b4b5e; }
            .footer { text-align: center; margin-top: 24px; font-size: 0.8rem; color: #666; border-top: 1px dashed #ccc; padding-top: 12px; }
            .paid { background: #e6f7ec; color: #11865a; padding: 8px; border-radius: 6px; text-align: center; font-weight: bold; margin: 12px 0; }
            .pending { background: #fff4d6; color: #b45309; padding: 8px; border-radius: 6px; text-align: center; font-weight: bold; margin: 12px 0; }
            @media print { body { padding: 0; } button { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>NextGen Pascual Resort</h1>
            <p>Victoria, Oriental Mindoro</p>
            <p>Booking Receipt</p>
          </div>

          <div class="section">
            <div class="row"><span>Receipt No:</span><strong>${data.bookingId.slice(0, 8).toUpperCase()}</strong></div>
            <div class="row"><span>Date Issued:</span><strong>${data.dateCreated}</strong></div>
          </div>

          <div class="divider"></div>

          <div class="section">
            <div class="row"><span>Customer:</span><strong>${data.customerName}</strong></div>
            <div class="row"><span>Contact:</span><strong>${data.phone}</strong></div>
            <div class="row"><span>Date of Booking:</span><strong>${data.date}</strong></div>
            ${data.adults !== null ? `<div class="row"><span>Guests:</span><strong>${data.adults} Adults, ${data.kids ?? 0} Kids</strong></div>` : ''}
            ${data.cottage ? `<div class="row"><span>Cottage:</span><strong>${data.cottage.name}</strong></div>` : ''}
            <div class="row"><span>Service:</span><strong>${data.listingName}</strong></div>
          </div>

          <div class="divider"></div>

          <div class="section">
            <div class="row"><span>Total Amount:</span><strong>₱${data.total.toLocaleString()}</strong></div>
            <div class="row"><span>Paid Now:</span><strong>₱${data.amountPaid.toLocaleString()}</strong></div>
            <div class="row"><span>Balance:</span><strong>₱${data.balance.toLocaleString()}</strong></div>
            <div class="row"><span>Payment Mode:</span><strong>${data.paymentMethod.toUpperCase()}</strong></div>
            <div class="row"><span>Reference No:</span><strong>${data.referenceNo}</strong></div>
          </div>

          <div class="divider"></div>

          <div class="paid">PAYMENT VERIFIED ✓</div>

          <div class="footer">
            <p>Thank you for booking with us!</p>
            <p>Please present this receipt upon arrival.</p>
            <p>For inquiries, contact us at support@nextgenresort.com</p>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  return (
    <button
      type="button"
      onClick={handlePrint}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        width: '100%',
        marginTop: 16,
        padding: '14px',
        background: '#0b4b5e',
        color: '#fff',
        border: 'none',
        borderRadius: 12,
        fontSize: '1rem',
        fontWeight: 700,
        cursor: 'pointer',
      }}
    >
      <IonIcon icon={printOutline} /> Print Receipt
    </button>
  );
};

export default Receipt;