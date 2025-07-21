import React from 'react';
import AnimatedBackground from './AnimatedBackground';
import './VotingScreen.css';

interface VotingScreenProps {
  wordOptions: string[];
  votes: { [word: string]: number };
  onVote: (word: string) => void;
}

const VotingScreen: React.FC<VotingScreenProps> = ({ wordOptions, votes, onVote }) => {
  return (
    <div id="VotingScreen" className="screen-container">
      <AnimatedBackground />
      <div className="container-fluid" style={{ height: '100vh' }}>
        <div className="row align-items-center" style={{ height: '20%' }}>
          <div className="col text-center">
            <img src="/Logo3.PNG" alt="Doodle Logo" className="logo-image-small" onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }} />
          </div>
        </div>
        
        <div className="row justify-content-center align-items-center" style={{ height: '20%' }}>
          <div className="col-10 text-center">
            <h1 className="vote-title">What To Doodle?</h1>
            <h3 className="text-white">Choose what everyone will draw!</h3>
          </div>
        </div>
        
        <div className="row justify-content-center" style={{ height: '60%' }}>
          <div className="col-lg-8 text-center">
            <div className="row align-items-center" style={{ height: '15%' }}>
              <div className="col text-center">
                <h2>Word Options</h2>
              </div>
            </div>
            <div className="row align-items-start" style={{ height: '85%' }}>
              <div className="col text-center">
                <ul className="list-group align-items-center">
                  {wordOptions.map((word) => (
                    <li 
                      key={word}
                      className="li-element-term list-group-item d-flex justify-content-between align-items-center shadow"
                      onClick={() => onVote(word)}
                      style={{ cursor: 'pointer' }}
                    >
                      <h3 className="h3-override-term">{word}</h3>
                      <span className="badge badge-primary badge-pill">
                        {votes[word] || 0}
                      </span>
                    </li>
                  ))}
                </ul>
                
                <div className="voting-info mt-4">
                  <p className="text-white">
                    Click on a word to vote! Game starts when everyone has voted.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VotingScreen; 