const LandingPage = () => {
  return (
    <div style={{ textAlign: 'center', padding: '50px 0' }}>
      <h1>Welcome to the DT/Bug Club! 🌈</h1>
      <p style={{ fontSize: '20px', maxWidth: '600px', margin: '20px auto' }}>
        We are a combined club of high energy and big smiles. 
        Whether you're in DT or Bug, you're part of the best crew in town!
      </p>
      
      <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', marginTop: '40px' }}>
        <div className="card" style={{ width: '300px' }}>
          <h2 style={{ color: 'var(--dt-color)' }}>DT Club 🔵</h2>
          <p>Where passion meets performance.</p>
        </div>
        <div className="card" style={{ width: '300px' }}>
          <h2 style={{ color: 'var(--bug-color)' }}>Bug Club 🟢</h2>
          <p>The small but mighty team!</p>
        </div>
      </div>
      
      <div style={{ marginTop: '50px' }}>
        <button className="btn-primary" onClick={() => window.location.href='/dashboard'}>
          Go to Manager Dashboard 🚀
        </button>
      </div>
    </div>
  );
};

export default LandingPage;
