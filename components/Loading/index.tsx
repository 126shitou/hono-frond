interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export const Loading = ({ 
  size = 'md', 
  text = 'loading...', 
  className = '' 
}: LoadingProps) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      {/* 旋转的圆环加载器 */}
      <div className="relative">
        <svg
          className={`animate-spin ${sizeClasses[size]}`}
          style={{ color: '#A76EFF' }}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      </div>
      
      {/* 加载文本 */}
      {text && (
        <p className={`${textSizeClasses[size]} font-medium animate-pulse`} style={{ color: '#857BA1' }}>
          {text}
        </p>
      )}
    </div>
  );
};

// 全屏加载组件
export const FullScreenLoading = ({ text = 'loading...' }: { text?: string }) => {
  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(167, 110, 255, 0.1)' }}>
      <Loading size="lg" text={text} />
    </div>
  );
};

// 简单的内联加载器（只有图标）
export const InlineLoading = ({ size = 'sm' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <svg
      className={`animate-spin ${sizeClasses[size]}`}
      style={{ color: '#A76EFF' }}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );
};