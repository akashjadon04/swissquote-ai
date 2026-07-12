const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'src/app/quotes/new/page.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

const anchor = `useQuoteStore.getState().recalculateFinancials();
                        }}
                      />
                    </div>
                  </div>`;

const newClientBlock = `useQuoteStore.getState().recalculateFinancials();
                        }}
                      />
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/10">
                      <h3 className="text-xl font-semibold mb-4 text-white">Informations Client (PDF)</h3>
                      <div className="flex flex-col gap-4">
                        <div className="param-group flex flex-col gap-2">
                          <label className="text-sm font-medium text-text-muted">Nom du client</label>
                          <input type="text" className="neo-input w-full" placeholder="Ex: Jean Dupont" value={quote.clientName || ''} onChange={(e) => setQuote({ clientName: e.target.value })} />
                        </div>
                        <div className="param-group flex flex-col gap-2">
                          <label className="text-sm font-medium text-text-muted">Adresse (Rue)</label>
                          <input type="text" className="neo-input w-full" placeholder="Ex: Rue de la Gare 12" value={quote.clientAddress || ''} onChange={(e) => setQuote({ clientAddress: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="param-group flex flex-col gap-2">
                            <label className="text-sm font-medium text-text-muted">NPA</label>
                            <input type="text" className="neo-input w-full" placeholder="Ex: 1000" value={quote.clientPostal || ''} onChange={(e) => setQuote({ clientPostal: e.target.value })} />
                          </div>
                          <div className="param-group flex flex-col gap-2">
                            <label className="text-sm font-medium text-text-muted">Ville</label>
                            <input type="text" className="neo-input w-full" placeholder="Ex: Lausanne" value={quote.clientCity || ''} onChange={(e) => setQuote({ clientCity: e.target.value })} />
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>`;

content = content.replace(anchor, newClientBlock);

fs.writeFileSync(targetFile, content, 'utf8');
console.log("Client form inserted successfully!");
