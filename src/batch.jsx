import React from 'react';
import ReactDOM from 'react-dom';

import FileDropPage from './fileProc';

const MODEL = 'english';

ReactDOM.render(<FileDropPage modelName={MODEL} />,
  document.getElementById('root'));
