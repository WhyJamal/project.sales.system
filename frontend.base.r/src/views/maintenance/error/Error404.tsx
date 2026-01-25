import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const NotFoundPage: React.FC = () => {
  return (
    <div
      className="
        flex flex-col
        items-start
        justify-start
        h-screen
        text-left
        text-white
        p-11 sm:p-10 md:p-20
      "
      style={{
        background: `#00AFF9 url("/images/Unplugged.webp") center/cover no-repeat`,
      }}
    >
      <motion.h1
        className="text-4xl sm:text-6xl md:text-7xl font-bold mb-4"
        initial={{ x: -500, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 70, delay: 0.2 }}
      >
        Whoops!
      </motion.h1>

      <motion.p
        className="text-lg sm:text-2xl mb-6 max-w-md"
        initial={{ x: -500, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 70, delay: 0.4 }}
      >
        Something went wrong
      </motion.p>

      <motion.div
        initial={{ x: -500, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 70, delay: 0.6 }}
      >
        <Link
          to="/"
          className="
            px-6 py-3
            bg-blue-600 text-white rounded
            hover:bg-blue-700 transition
            text-base
          "
        >
          На главную
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFoundPage;
