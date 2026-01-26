import React from "react";
import { motion } from "framer-motion";

const HeroVisual: React.FC = () => {
  return (
    <div className="lg:col-span-5 relative flex justify-center lg:justify-end">
      <div className="w-full max-w-[500px] h-[500px] relative">
        <motion.div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-500 rotate-45 rounded-lg shadow-xl z-10"
          initial={{ scale: 0, rotate: 0, opacity: 0 }}
          whileInView={{ scale: 1, rotate: 45, opacity: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5 }}
        >
          <div className="absolute inset-2 bg-white/20 rounded-sm"></div>
        </motion.div>

        <motion.div
          className="absolute top-8 right-0 w-[280px] h-[140px] rounded-sm overflow-hidden shadow-2xl z-20"
          initial={{ x: 100, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <motion.img
            src="/images/working-girls.webp"
            alt="Professional at desk"
            className="w-full h-full object-cover"
            initial={{ scale: 0.8 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          />
        </motion.div>

        <motion.div
          className="absolute top-24 left-0 flex flex-col gap-2 z-5"
          initial={{ y: -50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="w-16 h-6 bg-gradient-to-r from-teal-400 to-teal-500 rounded-full"></div>
          <div className="w-24 h-6 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full"></div>
          <div className="w-16 h-6 bg-gradient-to-r from-pink-400 to-pink-500 rounded-full"></div>
        </motion.div>

        <motion.div
          className="absolute top-[180px] left-0 w-[320px] h-[160px] rounded-sm overflow-hidden shadow-2xl z-20"
          initial={{ x: -100, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <motion.img
            src="/images/working-girl.webp"
            alt="Woman working on laptop"
            className="w-full h-full object-cover"
            initial={{ scale: 0.9 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          />
        </motion.div>

        <motion.div
          className="absolute top-[220px] right-12 w-12 h-12 z-10"
          initial={{ scale: 0, rotate: -45, opacity: 0 }}
          whileInView={{ scale: 1, rotate: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg -rotate-45"></div>
        </motion.div>

        <motion.div
          className="absolute top-[300px] right-0 w-32 h-32 bg-gradient-to-br from-pink-400 to-pink-500 rounded-tl-[100px] shadow-xl z-5"
          initial={{ scale: 0, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, delay: 1 }}
        ></motion.div>

        <motion.div
          className="absolute bottom-20 left-8 w-12 h-12 z-10"
          initial={{ scale: 0, rotate: 0, opacity: 0 }}
          whileInView={{ scale: 1, rotate: 45, opacity: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5, delay: 1.2 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg rotate-45"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg -rotate-45"></div>
        </motion.div>

        <motion.div
          className="absolute bottom-0 right-4 w-[280px] h-[140px] overflow-hidden shadow-2xl z-20 rounded-sm"
          initial={{ y: 100, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5, delay: 1 }}
        >
          <motion.img
            src="/images/working-with-team.webp"
            alt="Business meeting"
            className="w-full h-full object-cover"
            initial={{ scale: 0.9 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5, delay: 1. }}
          />
        </motion.div>

        <motion.div
          className="absolute bottom-2 right-0 flex gap-2 z-5"
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, delay: 1.4 }}
        >
          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full"></div>
          <div className="w-16 h-8 bg-gradient-to-r from-pink-400 to-pink-500 rounded-full"></div>
        </motion.div>
      </div>
    </div>
  );
};

export default HeroVisual;
