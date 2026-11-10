import React, { useEffect, useMemo, useState } from 'react';
import { IonContent, IonPage, IonIcon } from '@ionic/react';
import {
  searchOutline, gridOutline, sunnyOutline, moonOutline, bedOutline,
  businessOutline, micOutline, checkmarkCircleOutline, arrowForwardOutline, star,
} from 'ionicons/icons';
import { useSearchParams } from 'react-router-dom';
import { Category, Listing, ListingCategory, LISTINGS } from '../../data/listings';
import { subscribeServices, ServiceStatus } from '../../services/servicesService';
import ListingModal from './ListingModal';
import './CustomerHome.css';

const CATEGORIES: { key: Category; label: string; icon: string }[] = [
  { key: 'all', label: 'All Listings', icon: gridOutline },
  { key: 'day', label: 'Day Tour Packages', icon: sunnyOutline },
  { key: 'night', label: 'Night Tour Packages', icon: moonOutline },
  { key: 'rooms', label: 'Rooms', icon: bedOutline },
  { key: 'halls', label: 'Function Halls', icon: businessOutline },
  { key: 'extras', label: 'Extras', icon: micOutline },
];

const CATEGORY_ICON: Record<ListingCategory, string> = {
  day: sunnyOutline, night: moonOutline, rooms: bedOutline, halls: businessOutline, extras: micOutline,
};

const CustomerHome: React.FC = () => {
  const [searchParams] = useSearchParams();
  const catParam = searchParams.get('cat') as Category | null;

  const [category, setCategory] = useState<Category>(catParam || 'all');
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Listing | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [servicesMap, setServicesMap] = useState<Record<string, ServiceStatus>>({});

  useEffect(() => {
    if (catParam) setCategory(catParam);
    else setCategory('all');
  }, [catParam]);

  useEffect(() => {
    const unsub = subscribeServices(setServicesMap);
    return unsub;
  }, []);

  const openDetails = (item: Listing) => {
    setSelected(item);
    setModalOpen(true);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return LISTINGS.filter((l) => {
      const matchCat = category === 'all' || l.category === category;
      const matchSearch = !q || l.name.toLowerCase().includes(q) || l.label.toLowerCase().includes(q) || l.tags.some((t) => t.toLowerCase().includes(q)) || (l.options ?? []).some((o) => o.name.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [category, search]);

  return (
    <IonPage>
      {/* TINANGGAL ANG fullscreen PARA HINDI MATABUNAN NG HEADER */}
      <IonContent className="ch-content">
        <section className="ch-hero" id="ch-hero">
          <div className="ch-hero-inner">
            <div className="ch-hero-badge">
              <IonIcon icon={star} /> Premium Resort Experience
            </div>
            <h1>
              Next Gen
              <span>Pascual Resort</span>
            </h1>
            <p>
              Your Journey, Our Passion. Discover breathtaking resort cottages,
              private rooms, and spacious function venues.
            </p>
          </div>
        </section>

        <div className="ch-main-container">
          <form className="ch-search" onSubmit={(e) => { e.preventDefault(); setSearch(query); }}>
            <IonIcon icon={searchOutline} className="ch-search-icon" />
            <input
              type="text"
              placeholder="Search cottages, rooms..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (!e.target.value) setSearch('');
              }}
            />
            <button type="submit">Search</button>
          </form>

          <div className="ch-cat-head">
            <h2><IonIcon icon={gridOutline} /> Categories</h2>
            <span>Showing {filtered.length} items</span>
          </div>

          <div className="ch-chips">
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                type="button"
                className={`ch-chip ${category === c.key ? 'active' : ''}`}
                onClick={() => setCategory(c.key)}
              >
                <IonIcon icon={c.icon} /> {c.label}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="ch-empty">No results found. Try another search or category.</div>
          ) : (
            <div className="ch-grid">
              {filtered.map((item) => {
                const s = servicesMap[item.id];
                const isFullyBooked = s?.status === 'fully-booked' || s?.slots === 0;

                return (
                  <article className={`ch-card ${isFullyBooked ? 'is-fully-booked' : ''}`} key={item.id}>
                    <div className="ch-card-img">
                      <img src={item.image} alt={item.name} loading="lazy" />
                      <span className="ch-card-badge">
                        <IonIcon icon={CATEGORY_ICON[item.category]} />
                      </span>
                      {isFullyBooked && <span className="ch-fully-booked-overlay">Fully Booked</span>}
                    </div>

                    <div className="ch-card-body">
                      <div className="ch-card-top">
                        <span className="ch-card-cat">{item.label}</span>
                        <span className="ch-card-price">{item.priceText}</span>
                      </div>
                      <h3>{item.name}</h3>

                      {!isFullyBooked && s?.slots !== null && s?.slots !== undefined && s.slots > 0 && (
                        <div className="ch-slots-left">🔥 {s.slots} slots left</div>
                      )}

                      <div className="ch-tags">
                        {item.tags.map((t) => (
                          <span key={t}><IonIcon icon={checkmarkCircleOutline} /> {t}</span>
                        ))}
                      </div>

                      <button
                        type="button"
                        className="ch-card-btn"
                        onClick={() => openDetails(item)}
                        disabled={isFullyBooked}
                      >
                        {isFullyBooked ? 'Fully Booked' : 'View Details'} 
                        {!isFullyBooked && <IonIcon icon={arrowForwardOutline} />}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <ListingModal
          listing={selected}
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          isFullyBooked={selected ? (servicesMap[selected.id]?.status === 'fully-booked' || servicesMap[selected.id]?.slots === 0) : false}
        />
      </IonContent>
    </IonPage>
  );
};

export default CustomerHome;