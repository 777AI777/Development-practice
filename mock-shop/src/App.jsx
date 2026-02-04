import { useMemo, useState } from "react";

const products = [
  {
    id: "aurora-headphones",
    name: "オーロラ・ヘッドホン",
    price: 12800,
    tag: "オーディオ",
    category: "ガジェット",
    rating: 4.8,
    description: "ワイヤレスで快適。32時間バッテリー。",
    color: "sunset",
  },
  {
    id: "noon-mug",
    name: "ヌーン・セラミックマグ",
    price: 2200,
    tag: "ライフスタイル",
    category: "キッチン",
    rating: 4.6,
    description: "二重構造で保温。さらっとした手触り。",
    color: "mint",
  },
  {
    id: "atlas-backpack",
    name: "アトラス・トラベルパック",
    price: 17600,
    tag: "バッグ",
    category: "トラベル",
    rating: 4.9,
    description: "20L収納。防水シェルと隠しポケット。",
    color: "sky",
  },
  {
    id: "verve-lamp",
    name: "ヴァーヴ・デスクランプ",
    price: 8900,
    tag: "ホーム",
    category: "ホーム",
    rating: 4.7,
    description: "タッチ調光、USB-Cで急速充電。",
    color: "peach",
  },
];

const currency = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
  maximumFractionDigits: 0,
});

export default function App() {
  const [cart, setCart] = useState([]);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [errors, setErrors] = useState({});
  const [activeCategory, setActiveCategory] = useState("すべて");
  const [form, setForm] = useState({
    name: "",
    email: "",
    address: "",
    delivery: "",
    payment: "card",
    note: "",
  });

  const categories = useMemo(() => {
    const unique = new Set(products.map((product) => product.category));
    return ["すべて", ...Array.from(unique)];
  }, []);

  const visibleProducts = useMemo(() => {
    if (activeCategory === "すべて") return products;
    return products.filter((product) => product.category === activeCategory);
  }, [activeCategory]);

  const cartItems = useMemo(() => {
    return cart
      .map((item) => {
        const product = products.find((productItem) => productItem.id === item.id);
        if (!product) return null;
        return {
          ...product,
          qty: item.qty,
          lineTotal: product.price * item.qty,
        };
      })
      .filter(Boolean);
  }, [cart]);

  const subtotal = cartItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const tax = Math.round(subtotal * 0.1);
  const shipping = subtotal === 0 || subtotal >= 20000 ? 0 : 800;
  const total = subtotal + tax + shipping;
  const itemCount = cartItems.reduce((sum, item) => sum + item.qty, 0);

  const addToCart = (id) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === id);
      if (existing) {
        return prev.map((item) =>
          item.id === id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { id, qty: 1 }];
    });
  };

  const updateQty = (id, qty) => {
    const nextQty = Math.max(0, qty);
    setCart((prev) => {
      if (nextQty === 0) return prev.filter((item) => item.id !== id);
      return prev.map((item) => (item.id === id ? { ...item, qty: nextQty } : item));
    });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextErrors = {};

    if (!form.name.trim()) nextErrors.name = "お名前を入力してください。";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      nextErrors.email = "正しいメールアドレスを入力してください。";
    }
    if (form.address.trim().length < 8) {
      nextErrors.address = "住所を入力してください。";
    }
    if (!form.delivery) nextErrors.delivery = "配送日を選択してください。";
    if (!form.payment) nextErrors.payment = "お支払い方法を選択してください。";
    if (cartItems.length === 0) nextErrors.cart = "商品を1点以上追加してください。";

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length === 0) {
      setOrderId(`MM-${Math.floor(100000 + Math.random() * 900000)}`);
      setOrderPlaced(true);
    }
  };

  return (
    <div className="app">
      <div className="background-orb orb-one" />
      <div className="background-orb orb-two" />

      <header className="hero">
        <div className="hero-text">
          <p className="eyebrow">ワンページフロー</p>
          <h1>
            Mono Market
            <span>選んで、整えて、すぐ購入。</span>
          </h1>
          <p className="subtitle">
            商品選択から購入完了まで、すべて1ページで完結するデモです。
            ライブカート、配送入力、即時確認まで体験できます。
          </p>
          <div className="hero-actions">
            <button type="button" className="ghost" onClick={() => addToCart(products[0].id)}>
              クイック追加: {products[0].name}
            </button>
            <div className="badge">{itemCount} 点がバッグにあります</div>
          </div>
        </div>
        <div className="hero-card">
          <div className="progress">
            <span className="step active">1. 選択</span>
            <span className="step active">2. 購入</span>
            <span className="step">3. 完了</span>
          </div>
          <div className="hero-card-body">
            <h3>本日限定</h3>
            <p>合計20,000円以上で配送無料。</p>
            <div className="chip-row">
              <span className="chip">ライブ合計</span>
              <span className="chip">入力チェック</span>
              <span className="chip">ワンページUX</span>
            </div>
          </div>
        </div>
      </header>

      <main className="content">
        <section className="catalog">
          <div className="section-header">
            <h2>商品を選ぶ</h2>
            <p>カードを押すだけで追加。数量はカートで調整できます。</p>
          </div>
          <div className="category-tabs" role="tablist" aria-label="商品カテゴリ">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                role="tab"
                aria-selected={activeCategory === category}
                className={`tab ${activeCategory === category ? "active" : ""}`}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
          <div className="product-grid">
            {visibleProducts.map((product, index) => (
              <article
                key={product.id}
                className={`product-card ${product.color}`}
                style={{ animationDelay: `${index * 0.08}s` }}
              >
                <div className="product-top">
                  <span className="tag">{product.tag}</span>
                  <span className="rating">{product.rating} ★</span>
                </div>
                <h3>{product.name}</h3>
                <p>{product.description}</p>
                <div className="product-bottom">
                  <span className="price">{currency.format(product.price)}</span>
                  <button type="button" className="primary" onClick={() => addToCart(product.id)}>
                    カートに入れる
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <form className="checkout" onSubmit={handleSubmit}>
          <section className="panel">
            <div className="panel-header">
              <h3>カート</h3>
              {errors.cart ? <span className="error-text">{errors.cart}</span> : null}
            </div>
            {cartItems.length === 0 ? (
              <p className="empty">カートが空です。商品を追加してください。</p>
            ) : (
              <div className="cart-list">
                {cartItems.map((item) => (
                  <div className="cart-item" key={item.id}>
                    <div>
                      <p className="cart-name">{item.name}</p>
                      <p className="cart-meta">{currency.format(item.price)} / 1点</p>
                    </div>
                    <div className="qty">
                      <button type="button" onClick={() => updateQty(item.id, item.qty - 1)}>
                        -
                      </button>
                      <span>{item.qty}</span>
                      <button type="button" onClick={() => updateQty(item.id, item.qty + 1)}>
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="panel form-panel">
            <div className="panel-header">
              <h3>配送情報</h3>
              <p>デモ用の簡易フォームです。</p>
            </div>
            <div className={`field ${errors.name ? "error" : ""}`}>
              <label htmlFor="name">お名前</label>
              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                placeholder="山田 花子"
              />
              {errors.name ? <span className="error-text">{errors.name}</span> : null}
            </div>
            <div className={`field ${errors.email ? "error" : ""}`}>
              <label htmlFor="email">メール</label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="example@example.jp"
              />
              {errors.email ? <span className="error-text">{errors.email}</span> : null}
            </div>
            <div className={`field ${errors.address ? "error" : ""}`}>
              <label htmlFor="address">住所</label>
              <input
                id="address"
                name="address"
                type="text"
                value={form.address}
                onChange={handleChange}
                placeholder="東京都港区"
              />
              {errors.address ? <span className="error-text">{errors.address}</span> : null}
            </div>
            <div className={`field ${errors.delivery ? "error" : ""}`}>
              <label htmlFor="delivery">配送日</label>
              <input
                id="delivery"
                name="delivery"
                type="date"
                value={form.delivery}
                onChange={handleChange}
              />
              {errors.delivery ? <span className="error-text">{errors.delivery}</span> : null}
            </div>
            <div className={`field ${errors.payment ? "error" : ""}`}>
              <label>お支払い方法</label>
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    name="payment"
                    value="card"
                    checked={form.payment === "card"}
                    onChange={handleChange}
                  />
                  カード
                </label>
                <label>
                  <input
                    type="radio"
                    name="payment"
                    value="bank"
                    checked={form.payment === "bank"}
                    onChange={handleChange}
                  />
                  銀行振込
                </label>
                <label>
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={form.payment === "cod"}
                    onChange={handleChange}
                  />
                  代引き
                </label>
              </div>
              {errors.payment ? <span className="error-text">{errors.payment}</span> : null}
            </div>
            <div className="field">
              <label htmlFor="note">ギフトメモ（任意）</label>
              <textarea
                id="note"
                name="note"
                rows="3"
                value={form.note}
                onChange={handleChange}
                placeholder="ひとことメッセージをどうぞ。"
              />
            </div>
          </section>

          <section className="panel summary">
            <div className="panel-header">
              <h3>注文内容</h3>
              <span className="summary-pill">{itemCount} 点</span>
            </div>
            <div className="summary-row">
              <span>小計</span>
              <span>{currency.format(subtotal)}</span>
            </div>
            <div className="summary-row">
              <span>消費税（10%）</span>
              <span>{currency.format(tax)}</span>
            </div>
            <div className="summary-row">
              <span>配送料</span>
              <span>{shipping === 0 ? "無料" : currency.format(shipping)}</span>
            </div>
            <div className="summary-total">
              <span>合計</span>
              <span>{currency.format(total)}</span>
            </div>
            <button type="submit" className="primary full">
              購入を確定する
            </button>
            <p className="fine-print">
              これはデモ画面です。実際の決済は行われません。
            </p>
          </section>
        </form>
      </main>

      <section className="reassurance">
        <div className="reassurance-card">
          <h3>チュートリアル向け設計</h3>
          <p>
            商品選択、カート編集、配送入力、購入確認をすべて1ページに集約。
            Reactの状態管理を学ぶのに最適です。
          </p>
        </div>
        <div className="reassurance-card">
          <h3>次のアイデア</h3>
          <p>クーポン追加やAPI連携、ステップ分割もおすすめです。</p>
        </div>
      </section>

      {orderPlaced ? (
        <div className="overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <p className="eyebrow">ありがとうございます</p>
            <h3>注文が完了しました</h3>
            <p>
              注文番号 <strong>{orderId}</strong> を受け付けました。
              {form.email || "ご登録のメール"} 宛に確認メールを送信します。
            </p>
            <button
              type="button"
              className="primary"
              onClick={() => setOrderPlaced(false)}
            >
              続けて買い物する
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
