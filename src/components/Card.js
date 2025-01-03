import styles from "./Card.module.css";
import { useDarkMode } from "../contexts/DarkModeContext";
import Link from "next/link";

const Card = ({ item, onEdit, onDelete }) => {
    const { isDarkMode } = useDarkMode();

    return (
        <div className={`${styles.card} ${isDarkMode ? styles.dark : ""}`}>
            <img
                src={item.preview_picture}
                alt={item.title}
                className={styles["card-image"]}
            />
            <div className={styles["card-content"]}>
                <Link href={`/quote/${item.id}`}>
                    <h2
                        className={styles["card-title"]}
                        dangerouslySetInnerHTML={{ __html: item.title }}
                    ></h2>
                </Link>
                <p>{item.domain_name}</p>
            </div>
            <div className={styles.actions}>
                <img
                    src="/tool_16453509.png"
                    alt="Edit"
                    className={styles["action-icon"]}
                    onClick={() => onEdit(item)}
                />
                <img
                    src="/trash-can_11030353.png"
                    alt="Delete"
                    className={styles["action-icon"]}
                    onClick={() => onDelete(item.id)}
                />
            </div>
        </div>
    );
};

export default Card;