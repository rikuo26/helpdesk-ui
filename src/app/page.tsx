import styles from "./page.module.css";
import InquiryForm from "@/components/InquiryForm";
import ChatBox from "@/components/ChatBox";

export default function Page() {
  return (
    <main className={styles.wrap}>
      <div className={styles.container}>
        <h1 className={styles.h1}>問い合わせと AI 相談</h1>
        <div className={styles.grid}>
          <section className={styles.card}>
            <h2 style={{marginBottom:8, fontSize:16}}>問い合わせフォーム</h2>
            <InquiryForm />
          </section>
          <section className={styles.card}>
            <h2 style={{marginBottom:8, fontSize:16}}>AI 相談チャット（β）</h2>
            <ChatBox />
          </section>
        </div>
      </div>
    </main>
  );
}