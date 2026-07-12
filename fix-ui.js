const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'src/app/quotes/new/page.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

const oldMobileRow1 = `<div className="flex items-center gap-4">
                              <div className="flex items-center gap-2 flex-1">
                                <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider w-8 shrink-0">Qté</span>
                                <input type="number" className={\`neo-input flex-1 \${item.quantity === 0 || !item.quantity ? 'border-danger border-2 bg-danger/5 text-danger font-bold' : ''}\`} value={item.quantity || ''} placeholder="0" min={0} step={0.1}
                                  onChange={(e) => useQuoteStore.getState().updateItem(sIdx, iIdx, { quantity: parseFloat(e.target.value) || 0 })} />
                              </div>
                              <div className="flex items-center gap-2 w-1/3">
                                <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Unité</span>
                                <input type="text" className={\`neo-input w-full text-sm \${!item.unit ? 'border-danger border-2 bg-danger/5' : ''}\`} placeholder="Unité" value={item.unit || ''} onChange={(e) => useQuoteStore.getState().updateItem(sIdx, iIdx, { unit: e.target.value })} />
                              </div>
                            </div>`;

const newMobileRow1 = `<div className="grid grid-cols-2 gap-3">
                              <div className="flex flex-col gap-1">
                                <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Qté</span>
                                <input type="number" className={\`neo-input w-full \${item.quantity === 0 || !item.quantity ? 'border-danger border-2 bg-danger/5 text-danger font-bold' : ''}\`} value={item.quantity || ''} placeholder="0" min={0} step={0.1}
                                  onChange={(e) => useQuoteStore.getState().updateItem(sIdx, iIdx, { quantity: parseFloat(e.target.value) || 0 })} />
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Unité</span>
                                <input type="text" className={\`neo-input w-full text-sm \${!item.unit ? 'border-danger border-2 bg-danger/5' : ''}\`} placeholder="Unité" value={item.unit || ''} onChange={(e) => useQuoteStore.getState().updateItem(sIdx, iIdx, { unit: e.target.value })} />
                              </div>
                            </div>`;

content = content.replace(oldMobileRow1, newMobileRow1);

const oldMobileRow2 = `<div className="flex items-center gap-4 pt-2 border-t border-border/50">
                              <div className="flex items-center gap-2 flex-1">
                                <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider shrink-0">P.U. HT</span>
                                <input type="number" className={\`neo-input flex-1 \${!item.unitPrice ? 'border-danger border-2 bg-danger/5' : ''}\`} placeholder="CHF" value={item.unitPrice || ''} onChange={(e) => useQuoteStore.getState().updateItem(sIdx, iIdx, { unitPrice: parseFloat(e.target.value) || 0 })} />
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider shrink-0">Total</span>
                                <strong className="text-accent font-bold text-base">
                                  {item.lineTotal ? formatAmount(item.lineTotal) : (item.unitPrice && item.quantity ? formatAmount(item.unitPrice * item.quantity) : '—')}
                                </strong>
                              </div>
                            </div>`;

const newMobileRow2 = `<div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/50 items-end">
                              <div className="flex flex-col gap-1">
                                <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">P.U. HT (CHF)</span>
                                <input type="number" className={\`neo-input w-full \${!item.unitPrice ? 'border-danger border-2 bg-danger/5' : ''}\`} placeholder="0.00" value={item.unitPrice || ''} onChange={(e) => useQuoteStore.getState().updateItem(sIdx, iIdx, { unitPrice: parseFloat(e.target.value) || 0 })} />
                              </div>
                              <div className="flex flex-col gap-1 text-right">
                                <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Total</span>
                                <strong className="text-accent font-bold text-lg leading-tight mt-1">
                                  {item.lineTotal ? formatAmount(item.lineTotal) : (item.unitPrice && item.quantity ? formatAmount(item.unitPrice * item.quantity) : '—')}
                                </strong>
                              </div>
                            </div>`;

content = content.replace(oldMobileRow2, newMobileRow2);

fs.writeFileSync(targetFile, content, 'utf8');
console.log("Replaced successfully!");
