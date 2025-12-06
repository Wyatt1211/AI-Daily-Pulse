import React from 'react';
import { NewsArticle } from '../types';
import { ExternalLink, Bookmark, Check, Trash2, Zap } from 'lucide-react';

interface NewsCardProps {
  article: NewsArticle;
  onArchive?: (article: NewsArticle) => void;
  onDismiss?: (id: string) => void;
  isArchived?: boolean;
}

const NewsCard: React.FC<NewsCardProps> = ({ article, onArchive, onDismiss, isArchived = false }) => {
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-red-400 bg-red-400/10 border-red-400/20";
    if (score >= 75) return "text-orange-400 bg-orange-400/10 border-orange-400/20";
    return "text-blue-400 bg-blue-400/10 border-blue-400/20";
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:border-slate-600 transition-all duration-300 group">
      <div className="flex justify-between items-start mb-4">
        <div className="flex gap-2 flex-wrap">
          {article.tags.map((tag, idx) => (
            <span key={idx} className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-700 text-slate-300">
              #{tag}
            </span>
          ))}
        </div>
        <div className={`flex items-center space-x-1 px-2 py-1 rounded-lg border ${getScoreColor(article.score)}`}>
          <Zap size={14} />
          <span className="text-xs font-bold">{article.score}</span>
        </div>
      </div>

      <h3 className="text-xl font-bold text-white mb-3 leading-tight group-hover:text-blue-400 transition-colors">
        {article.title}
      </h3>
      
      <p className="text-slate-300 text-sm leading-relaxed mb-4">
        {article.summary}
      </p>

      {article.reason && (
        <div className="mb-4 text-xs text-slate-500 bg-slate-900/50 p-2 rounded border border-slate-800">
          <span className="font-semibold text-slate-400">Why it matters:</span> {article.reason}
        </div>
      )}

      {article.sources.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {article.sources.map((source, idx) => (
            <a
              key={idx}
              href={source.uri}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 text-xs text-blue-400 hover:text-blue-300 hover:underline"
            >
              <ExternalLink size={10} />
              <span>{source.title || "Source"}</span>
            </a>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
        <span className="text-xs text-slate-500">{article.date}</span>
        
        <div className="flex space-x-2">
          {!isArchived && onDismiss && (
            <button 
              onClick={() => onDismiss(article.id)}
              className="p-2 text-slate-500 hover:text-slate-300 hover:bg-slate-700 rounded-lg transition-colors"
              title="Dismiss"
            >
              <Trash2 size={18} />
            </button>
          )}
          
          {!isArchived && onArchive && (
            <button
              onClick={() => onArchive(article)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-blue-900/20"
            >
              <Bookmark size={16} />
              <span>Save to Repo</span>
            </button>
          )}

          {isArchived && onDismiss && (
             <button
             onClick={() => onDismiss(article.id)}
             className="flex items-center space-x-2 px-4 py-2 bg-slate-700 hover:bg-red-500/20 hover:text-red-400 text-slate-300 text-sm font-medium rounded-lg transition-colors"
           >
             <Trash2 size={16} />
             <span>Remove</span>
           </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewsCard;