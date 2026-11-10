import React, { useRef } from 'react';
import { IonModal, IonButton, IonIcon } from '@ionic/react';
import { printOutline, downloadOutline, closeOutline } from 'ionicons/icons';
import html2pdf from 'html2pdf.js';

interface ReceiptData {
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
  isOpen: boolean;
  onClose: () => void;
  data: ReceiptData;
}

const ReceiptModal: React.FC<Props> = ({ isOpen, onClose, data }) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !receiptRef.current) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt - ${data.bookingId}</title>
          <style>
            body { font-family: 'Courier New', monospace; padding: 40px; max-width: 400px; margin: 0 auto; color: #333; }
            .header { text-align: center; border-bottom: 2px dashed #0b4b5e; padding-bottom: 16px; margin-bottom: 16px; }
            .header h1 { margin: 0; font-size: 1.4rem; color: #0b4b5e; }
            .header p { margin: 4px 0; font-size: 0.85rem; }
            .section { margin-bottom: 12px; }
            .row { display: flex; justify-content: space-between; font-size: 0.9rem; padding: 4px 0; }
            .row strong { font-weight: 700; }
            .divider { border-top: 1px dashed #ccc; margin: 12px 0; }
            .footer { text-align: center; margin-top: 24px; font-size: 0.8rem; color: #666; border-top: 1px dashed #ccc; padding-top: 12px; }
            .pending { background: #fff4d6; color: #b45309; padding: 8px; border-radius: 6px; text-align: center; font-weight: bold; margin: 12px 0; }
          </style>
        </head>
        <body>
          ${receiptRef.current.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const handleDownload = () => {
    if (!receiptRef.current) return;
    
    // IDINAGDAG ANG 'as const' PARA SA TYPE FIX
    const opt = {
      margin: 10,
      filename: `Receipt_${data.bookingId.slice(0, 8)}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
    };

    html2pdf().set(opt).from(receiptRef.current).save();
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <div style={{ padding: '20px', background: '#f4f7f8', height: '100%', display: 'flex', flexDirection: 'column' }}>
        
        {/* HEADER NG MODAL */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, color: '#0b4b5e' }}>Receipt Preview</h2>
          <IonButton fill="clear" onClick={onClose}>
            <IonIcon icon={closeOutline} slot="icon-only" />
          </IonButton>
        </div>

        {/* RECEIPT PREVIEW */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', justifyContent: 'center' }}>
          <div 
            ref={receiptRef}
            style={{
              background: '#fff',
              padding: '40px',
              maxWidth: '400px',
              width: '100%',
              fontFamily: "'Courier New', monospace",
              color: '#333',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              borderRadius: '8px',
              height: 'fit-content'
            }}
          >
            <div className="header" style={{ textAlign: 'center', borderBottom: '2px dashed #0b4b5e', paddingBottom: '16px', marginBottom: '16px' }}>
              <h1 style={{ margin: 0, fontSize: '1.4rem', color: '#0b4b5e' }}>NextGen Pascual Resort</h1>
              <p style={{ margin: '4px 0', fontSize: '0.85rem' }}>Victoria, Oriental Mindoro</p>
              <p style={{ margin: '4px 0', fontSize: '0.85rem' }}>Booking Receipt</p>
            </div>

            <div className="section" style={{ marginBottom: '12px' }}>
              <div className="row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', padding: '4px 0' }}>
                <span>Receipt No:</span><strong>{data.bookingId.slice(0, 8).toUpperCase()}</strong>
              </div>
              <div className="row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', padding: '4px 0' }}>
                <span>Date Issued:</span><strong>{data.dateCreated}</strong>
              </div>
            </div>

            <div className="divider" style={{ borderTop: '1px dashed #ccc', margin: '12px 0' }}></div>

            <div className="section" style={{ marginBottom: '12px' }}>
              <div className="row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', padding: '4px 0' }}>
                <span>Customer:</span><strong>{data.customerName}</strong>
              </div>
              <div className="row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', padding: '4px 0' }}>
                <span>Contact:</span><strong>{data.phone}</strong>
              </div>
              <div className="row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', padding: '4px 0' }}>
                <span>Booking Date:</span><strong>{data.date}</strong>
              </div>
              {data.adults !== null && (
                <div className="row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', padding: '4px 0' }}>
                  <span>Guests:</span><strong>{data.adults} Adults, {data.kids} Kids</strong>
                </div>
              )}
              {data.cottage && (
                <div className="row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', padding: '4px 0' }}>
                  <span>Cottage:</span><strong>{data.cottage.name}</strong>
                </div>
              )}
              <div className="row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', padding: '4px 0' }}>
                <span>Service:</span><strong>{data.listingName}</strong>
              </div>
            </div>

            <div className="divider" style={{ borderTop: '1px dashed #ccc', margin: '12px 0' }}></div>

            <div className="section" style={{ marginBottom: '12px' }}>
              <div className="row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', padding: '4px 0' }}>
                <span>Total Amount:</span><strong>₱{data.total.toLocaleString()}</strong>
              </div>
              <div className="row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', padding: '4px 0' }}>
                <span>Paid Now:</span><strong>₱{data.amountPaid.toLocaleString()}</strong>
              </div>
              <div className="row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', padding: '4px 0' }}>
                <span>Balance:</span><strong>₱{data.balance.toLocaleString()}</strong>
              </div>
              <div className="row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', padding: '4px 0' }}>
                <span>Payment Mode:</span><strong>{data.paymentMethod.toUpperCase()}</strong>
              </div>
              <div className="row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', padding: '4px 0' }}>
                <span>Reference No:</span><strong>{data.referenceNo}</strong>
              </div>
            </div>

            <div className="divider" style={{ borderTop: '1px dashed #ccc', margin: '12px 0' }}></div>

            <div className="pending" style={{ background: '#fff4d6', color: '#b45309', padding: '8px', borderRadius: '6px', textAlign: 'center', fontWeight: 'bold', margin: '12px 0' }}>
              PAYMENT FOR VERIFICATION
            </div>

            <div className="footer" style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.8rem', color: '#666', borderTop: '1px dashed #ccc', paddingTop: '12px' }}>
              <p style={{ margin: '4px 0' }}>Thank you for booking with us!</p>
              <p style={{ margin: '4px 0' }}>Please present this receipt upon arrival.</p>
              <p style={{ margin: '4px 0' }}>support@nextgenresort.com</p>
            </div>
          </div>
        </div>

        {/* BUTTONS */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '16px', paddingBottom: '20px' }}>
          <button
            onClick={handlePrint}
            style={{
              flex: 1, padding: '16px', background: '#0b4b5e', color: '#fff',
              border: 'none', borderRadius: '12px', fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
            }}
          >
            <IonIcon icon={printOutline} /> Print
          </button>
          <button
            onClick={handleDownload}
            style={{
              flex: 1, padding: '16px', background: '#2ab88a', color: '#fff',
              border: 'none', borderRadius: '12px', fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
            }}
          >
            <IonIcon icon={downloadOutline} /> Download PDF
          </button>
        </div>
      </div>
    </IonModal>
  );
};

export default ReceiptModal;