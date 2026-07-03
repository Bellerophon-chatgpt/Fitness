// app.jsx — lay the three variants out on a design canvas
const { useEffect } = React;

function Phone({ children }) {
  // No iOS title bar — FORM&FUEL draws its own header. Dark device.
  return (
    <IOSDevice dark>
      {children}
    </IOSDevice>
  );
}

function App() {
  return (
    <DesignCanvas>
      <DCSection
        id="train"
        title="Train-scherm · 3 varianten"
        subtitle="Sneller loggen op mobiel — open elk fullscreen en tik erop"
      >
        <DCArtboard id="a" label="A · Checklist — tik elke set af" width={402} height={874}>
          <Phone><VariantA /></Phone>
        </DCArtboard>
        <DCArtboard id="b" label="B · Focus-modus — grote knoppen + rusttimer" width={402} height={874}>
          <Phone><VariantB /></Phone>
        </DCArtboard>
        <DCArtboard id="c" label="C · Snel toevoegen — picker, geen typen" width={402} height={874}>
          <Phone><VariantC /></Phone>
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
