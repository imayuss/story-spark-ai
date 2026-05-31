import { FC, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaqItem } from "../help_center.utils";

interface FAQAccordionProps {
  items: FaqItem[];
}

const FAQAccordion: FC<FAQAccordionProps> = ({ items }) => {
  const [openId, setOpenId] = useState<string | null>(null);

  const toggleItem = (id: string) => {
    setOpenId((current) => (current === id ? null : id));
  };

  return (
    <section
      id="faq"
      className="scroll-mt-28 transition-colors duration-300"
    >
      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 text-indigo-400 mb-4">
          <i className="fa-solid fa-circle-question"></i>
          <span className="text-sm font-semibold uppercase">Frequently Asked Questions</span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
          Common Questions
        </h2>

        <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Find quick answers to the most common StorySparkAI questions,
          workflows, and troubleshooting topics.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-white/[0.03] p-12 text-center">
          <div className="w-20 h-20 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center mx-auto mb-5">
            <i className="fa-solid fa-question text-3xl text-slate-500"></i>
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No FAQs Found</h3>
          <p className="text-slate-600 dark:text-slate-400">Try searching with different keywords.</p>
        </div>
      ) : (
        <div className="space-y-4 max-w-3xl mx-auto">
          {items.map((item, index) => {
            const isOpen = openId === item.id;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="group overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] backdrop-blur-xl shadow-sm hover:shadow-md transition-all duration-300"
              >
                <button
                  onClick={() => toggleItem(item.id)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left transition-all duration-300 hover:bg-slate-50 dark:hover:bg-white/[0.03]"
                  aria-expanded={isOpen}
                >
                  <span className="text-slate-900 dark:text-slate-200 font-bold pr-4">
                    {item.question}
                  </span>
                  <span
                    className={`flex-shrink-0 w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 transition-transform duration-300 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  >
                    <i className="fa-solid fa-chevron-down text-xs"></i>
                  </span>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="px-6 pb-6">
                        <div className="rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 p-4 mt-2">
                          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                            {item.answer}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default FAQAccordion;
