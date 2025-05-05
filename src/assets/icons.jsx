export const RowIcon = ({ size = 16, color = '#3A3A38' }) => (
    <svg
      height={size}
      width={size}
      viewBox="0 0 2048 2048"
      xmlns="http://www.w3.org/2000/svg"
      fill={color}
    >
      {/* <path
        d="M 320 960 v -640 h 1408 v 640 z"
      /> */}
      <path
        d="M 256 1408 v -128 h 1536 v 128
           M 256 1792 v -128 h 1536 v 128
           M 1792 1024 H 256 V 256 h 1536
           m -128 640 V 384 H 384 v 512 z"
      />
    </svg>
  );

  export const ColumnIcon = ({ size = 16, color = '#3A3A38' }) => (
    <svg
      height={size}
      width={size}
      viewBox="0 0 2048 2048"
      xmlns="http://www.w3.org/2000/svg"
      fill={color}
    >
      {/* <path d="M 1408 1792 h -128 v -1536 h 128 m 384 1536 h -128 v -1536 h 128 m -768 0 v 1536 h -768 v -1536 m 640 128 h -512 v 1280 h 512 z" /> */}
      {/* <path d="M 960 1728 h -640 v -1408 h 640 z" /> */}
      <path d="M 1408 1792 h -128 v -1536 h 128 m 384 1536 h -128 v -1536 h 128 m -768 0 v 1536 h -768 v -1536 m 640 128 h -512 v 1280 h 512 z" />
    </svg>
  );

  
  
  