import re

file_path = "/src/components/BookingsManager.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Locate the start of the production form container
start_marker = "redial-form-container"
start_idx = content.find(start_marker)
if start_idx == -1:
    print("Error: Could not find start marker 'redial-form-container'")
    exit(1)

# Find the opening '<div' before the marker
div_start = content.rfind("<div", 0, start_idx)
if div_start == -1:
    print("Error: Could not find opening <div for redial-form-container")
    exit(1)

# Find the closing </DialogContent> and backtrack to find the ending ')}' of the else block
dialog_content_end = content.find("</DialogContent>", div_start)
if dialog_content_end == -1:
    print("Error: Could not find </DialogContent>")
    exit(1)

# Backtrack to the last closing bracket before </DialogContent>
else_block_end = content.rfind(")}", div_start, dialog_content_end)
if else_block_end == -1:
    print("Error: Could not find closing ')}' for production form")
    exit(1)

# We want to replace everything from div_start up to else_block_end
target_block = content[div_start:else_block_end]

replacement_block = """<div className="space-y-6 pt-2 pb-6 redial-form-container">
                {/* SECTION 1: CLIENT INFORMATION */}
                <Card className="border border-[#D4AF37]/20 bg-[#0c0c0b]/80 p-5 rounded-xl shadow-lg space-y-4 relative overflow-hidden">
                  <div className="border-b border-[#D4AF37]/10 pb-2.5 flex items-center gap-2">
                    <User className="w-4 h-4 text-[#D4AF37]" />
                    <Typography className="text-sm text-[#D4AF37] font-bold uppercase tracking-widest font-serif">
                      Client Information
                    </Typography>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextField
                      fullWidth
                      label="Bride Name"
                      placeholder="e.g. Eleanor"
                      value={brideName}
                      onChange={(e) => setBrideName(e.target.value)}
                      className="bg-black/25"
                    />
                    <TextField
                      fullWidth
                      label="Groom Name"
                      placeholder="e.g. Charles"
                      value={groomName}
                      onChange={(e) => setGroomName(e.target.value)}
                      className="bg-black/25"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextField
                      fullWidth
                      label="Contact Person Name"
                      placeholder="e.g. Eleanor"
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      className="bg-black/25"
                      required
                    />
                    <TextField
                      fullWidth
                      label="Email ID"
                      type="email"
                      placeholder="e.g. client@example.com"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      className="bg-black/25"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextField
                      fullWidth
                      label="Mobile Number"
                      placeholder="e.g. +91 98765 43210"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className="bg-black/25"
                      required
                    />
                    <TextField
                      fullWidth
                      label="Alternate Mobile Number"
                      placeholder="e.g. +91 98765 43211"
                      value={alternatePhone}
                      onChange={(e) => setAlternatePhone(e.target.value)}
                      className="bg-black/25"
                    />
                  </div>

                  <TextField
                    fullWidth
                    label="Full Address"
                    placeholder="e.g. 123 Luxury Lane, Kolkata"
                    multiline
                    rows={3}
                    value={fullAddress}
                    onChange={(e) => setFullAddress(e.target.value)}
                    className="bg-black/25"
                  />
                </Card>

                {/* SECTION 2: WORK INFORMATION */}
                <Card className="border border-[#D4AF37]/20 bg-[#0c0c0b]/80 p-5 rounded-xl shadow-lg space-y-4 relative overflow-hidden">
                  <div className="border-b border-[#D4AF37]/10 pb-2.5 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#D4AF37]" />
                    <Typography className="text-sm text-[#D4AF37] font-bold uppercase tracking-widest font-serif">
                      Work Information
                    </Typography>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <TextField
                      select
                      fullWidth
                      label="Booking For"
                      value={bookingFor}
                      onChange={(e) => setBookingFor(e.target.value)}
                      required
                      className="bg-black/25"
                    >
                      {['Wedding', 'Reception', 'Aiburobhat', 'Mehendi', 'Haldi', 'Pre Wedding', 'Birthday', 'Others'].map((opt) => (
                        <MenuItem key={opt} value={opt}>
                          {opt}
                        </MenuItem>
                      ))}
                    </TextField>

                    <TextField
                      select
                      fullWidth
                      label="Pre Wedding"
                      value={preWedding}
                      onChange={(e) => setPreWedding(e.target.value)}
                      className="bg-black/25"
                    >
                      {['Yes', 'No'].map((opt) => (
                        <MenuItem key={opt} value={opt}>
                          {opt}
                        </MenuItem>
                      ))}
                    </TextField>

                    <TextField
                      select
                      fullWidth
                      label="Booking Status"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="bg-black/25 font-bold"
                    >
                      <MenuItem value="pending">Pending Engagement</MenuItem>
                      <MenuItem value="confirmed">Confirmed / Retained</MenuItem>
                      <MenuItem value="in_progress">In Progress</MenuItem>
                      <MenuItem value="completed">Completed</MenuItem>
                      <MenuItem value="cancelled">Cancelled</MenuItem>
                    </TextField>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextField
                      fullWidth
                      label="Event Date"
                      placeholder="e.g. 8th Mar - 11th Mar 2027"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="bg-black/25"
                    />
                    <TextField
                      fullWidth
                      label="Wedding Date"
                      type="date"
                      slotProps={{ inputLabel: { shrink: true } }}
                      value={weddingDate}
                      onChange={(e) => setWeddingDate(e.target.value)}
                      required
                      className="bg-black/25"
                    />
                  </div>

                  <TextField
                    fullWidth
                    label="Wedding Location"
                    placeholder="e.g. Chateau Montelena, Kolkata"
                    value={weddingLocation}
                    onChange={(e) => setWeddingLocation(e.target.value)}
                    required
                    className="bg-black/25"
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextField
                      fullWidth
                      label="Reception Date"
                      type="date"
                      slotProps={{ inputLabel: { shrink: true } }}
                      value={receptionDate}
                      onChange={(e) => setReceptionDate(e.target.value)}
                      className="bg-black/25"
                    />
                    <TextField
                      fullWidth
                      label="Reception Location"
                      placeholder="e.g. Marriott Grand Ballroom, Kolkata"
                      value={receptionLocation}
                      onChange={(e) => setReceptionLocation(e.target.value)}
                      className="bg-black/25"
                    />
                  </div>
                </Card>

                {/* SECTION 3: PRICE DETAILS */}
                <Card className="border border-[#D4AF37]/20 bg-[#0c0c0b]/80 p-5 rounded-xl shadow-lg space-y-4 relative overflow-hidden">
                  <div className="border-b border-[#D4AF37]/10 pb-2.5 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-[#D4AF37]" />
                    <Typography className="text-sm text-[#D4AF37] font-bold uppercase tracking-widest font-serif">
                      Price Details
                    </Typography>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextField
                      select
                      fullWidth
                      label="Package Name"
                      value={packageName}
                      onChange={(e) => handlePackageChange(e.target.value)}
                      required
                      className="bg-black/25"
                    >
                      {!settings.packages || settings.packages.length === 0 ? (
                        <MenuItem disabled value="">
                          <em>No packages configured (Add in Brand Settings)</em>
                        </MenuItem>
                      ) : (
                        settings.packages.map((pkg) => (
                          <MenuItem key={pkg} value={pkg}>
                            {pkg}
                          </MenuItem>
                        ))
                      )}
                    </TextField>

                    <TextField
                      fullWidth
                      label="Package Price"
                      type="number"
                      value={packagePrice}
                      onChange={(e) => setPackagePrice(e.target.value !== '' ? Number(e.target.value) : '')}
                      slotProps={{
                        input: {
                          startAdornment: <InputAdornment position="start" className="text-[#D4AF37] font-mono">{settings.currencySymbol}</InputAdornment>,
                        }
                      }}
                      className="bg-black/25"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextField
                      fullWidth
                      label="Discount"
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value !== '' ? Number(e.target.value) : '')}
                      slotProps={{
                        input: {
                          startAdornment: <InputAdornment position="start" className="text-[#D4AF37] font-mono">{settings.currencySymbol}</InputAdornment>,
                        }
                      }}
                      className="bg-black/25"
                    />

                    <TextField
                      fullWidth
                      label="Total Amount"
                      type="number"
                      value={totalAmount}
                      disabled
                      slotProps={{
                        input: {
                          startAdornment: <InputAdornment position="start" className="text-gray-500 font-mono">{settings.currencySymbol}</InputAdornment>,
                        }
                      }}
                      className="bg-black/10 text-gray-400"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <TextField
                      fullWidth
                      label="Advance Amount"
                      type="number"
                      value={advanceAmount}
                      onChange={(e) => setAdvanceAmount(e.target.value !== '' ? Number(e.target.value) : '')}
                      slotProps={{
                        input: {
                          startAdornment: <InputAdornment position="start" className="text-[#D4AF37] font-mono">{settings.currencySymbol}</InputAdornment>,
                        }
                      }}
                      className="bg-black/25"
                    />

                    <TextField
                      fullWidth
                      label="First Payment"
                      type="number"
                      value={firstPayment}
                      onChange={(e) => setFirstPayment(e.target.value !== '' ? Number(e.target.value) : '')}
                      slotProps={{
                        input: {
                          startAdornment: <InputAdornment position="start" className="text-[#D4AF37] font-mono">{settings.currencySymbol}</InputAdornment>,
                        }
                      }}
                      className="bg-black/25"
                    />

                    <TextField
                      fullWidth
                      label="Second Payment"
                      type="number"
                      value={secondPayment}
                      onChange={(e) => setSecondPayment(e.target.value !== '' ? Number(e.target.value) : '')}
                      slotProps={{
                        input: {
                          startAdornment: <InputAdornment position="start" className="text-[#D4AF37] font-mono">{settings.currencySymbol}</InputAdornment>,
                        }
                      }}
                      className="bg-black/25"
                    />
                  </div>

                  <div className="p-4 rounded-xl border border-[#D4AF37]/30 bg-gradient-to-r from-amber-500/10 to-transparent flex justify-between items-center">
                    <div>
                      <Typography className="text-xs text-gray-400 font-serif uppercase tracking-wider">Remaining Due Balance</Typography>
                      <Typography variant="h5" className="text-[#D4AF37] font-bold font-mono mt-1">
                        {settings.currencySymbol}
                        {(
                          Number(totalAmount || 0) -
                          Number(advanceAmount || 0) -
                          Number(firstPayment || 0) -
                          Number(secondPayment || 0)
                        ).toLocaleString('en-IN')}
                      </Typography>
                    </div>
                    <Chip 
                      variant="outlined" 
                      label="Auto Calculated"
                      size="small"
                      className="border-[#D4AF37]/40 text-[#D4AF37] text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5"
                    />
                  </div>
                </Card>

                {/* SECTION 4: PACKAGE INCLUDE */}
                <Card className="border border-[#D4AF37]/20 bg-[#0c0c0b]/80 p-5 rounded-xl shadow-lg space-y-4 relative overflow-hidden">
                  <div className="border-b border-[#D4AF37]/10 pb-2.5 flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#D4AF37]" />
                    <Typography className="text-sm text-[#D4AF37] font-bold uppercase tracking-widest font-serif">
                      Package Include (Deliverables)
                    </Typography>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Photography Inclusions */}
                    <div className="p-4 bg-black/30 rounded-xl border border-gray-900 space-y-3">
                      <Typography className="text-xs text-[#D4AF37] font-bold uppercase tracking-wider border-b border-gray-900 pb-1 flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5" /> Photography Deliverables
                      </Typography>
                      <div className="grid grid-cols-1 gap-1">
                        <div className="flex items-center gap-1.5 py-0.5">
                          <Checkbox
                            checked={albumService}
                            onChange={(e) => setAlbumService(e.target.checked)}
                            size="small"
                            className="text-[#D4AF37] p-1"
                          />
                          <Typography className="text-xs text-gray-300">Album</Typography>
                        </div>
                        <div className="flex items-center gap-1.5 py-0.5">
                          <Checkbox
                            checked={frameService}
                            onChange={(e) => setFrameService(e.target.checked)}
                            size="small"
                            className="text-[#D4AF37] p-1"
                          />
                          <Typography className="text-xs text-gray-300">Photo Frame</Typography>
                        </div>
                        <div className="flex items-center gap-1.5 py-0.5">
                          <Checkbox
                            checked={pendriveService}
                            onChange={(e) => setPendriveService(e.target.checked)}
                            size="small"
                            className="text-[#D4AF37] p-1"
                          />
                          <Typography className="text-xs text-gray-300">Pendrive</Typography>
                        </div>
                        <div className="flex items-center gap-1.5 py-0.5">
                          <Checkbox
                            checked={editedPhotosService}
                            onChange={(e) => setEditedPhotosService(e.target.checked)}
                            size="small"
                            className="text-[#D4AF37] p-1"
                          />
                          <Typography className="text-xs text-gray-300">Edited Photos</Typography>
                        </div>
                      </div>
                    </div>

                    {/* Videography Inclusions */}
                    <div className="p-4 bg-black/30 rounded-xl border border-gray-900 space-y-3">
                      <Typography className="text-xs text-[#D4AF37] font-bold uppercase tracking-wider border-b border-gray-900 pb-1 flex items-center gap-1.5">
                        <Video className="w-3.5 h-3.5" /> Videography Deliverables
                      </Typography>
                      <div className="grid grid-cols-1 gap-1">
                        <div className="flex items-center gap-1.5 py-0.5">
                          <Checkbox
                            checked={standardEditService}
                            onChange={(e) => setStandardEditService(e.target.checked)}
                            size="small"
                            className="text-[#D4AF37] p-1"
                          />
                          <Typography className="text-xs text-gray-300">Standard Video Editing</Typography>
                        </div>
                        <div className="flex items-center gap-1.5 py-0.5">
                          <Checkbox
                            checked={cinematicEditService}
                            onChange={(e) => setCinematicEditService(e.target.checked)}
                            size="small"
                            className="text-[#D4AF37] p-1"
                          />
                          <Typography className="text-xs text-gray-300">Cinematic Video Editing</Typography>
                        </div>
                        <div className="flex items-center gap-1.5 py-0.5">
                          <Checkbox
                            checked={rawVideoService}
                            onChange={(e) => setRawVideoService(e.target.checked)}
                            size="small"
                            className="text-[#D4AF37] p-1"
                          />
                          <Typography className="text-xs text-gray-300">Raw Video</Typography>
                        </div>
                        <div className="flex items-center gap-1.5 py-0.5">
                          <Checkbox
                            checked={trailerService}
                            onChange={(e) => setTrailerService(e.target.checked)}
                            size="small"
                            className="text-[#D4AF37] p-1"
                          />
                          <Typography className="text-xs text-gray-300">Short Trailer</Typography>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* SECTION 5: TERMS & CONDITIONS PREVIEW */}
                <Card className="border border-gray-800 bg-[#0c0c0b]/40 p-5 rounded-xl space-y-3 relative overflow-hidden">
                  <Typography className="text-xs text-gray-400 font-bold uppercase tracking-widest font-serif border-b border-gray-900 pb-2">
                    Terms & Conditions Reference
                  </Typography>
                  <div className="max-h-40 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-gray-800 text-[11px] text-gray-500 leading-relaxed font-serif">
                    <p>1. Advanced payment is completely non-refundable under any circumstances.</p>
                    <p>2. Complete raw files will be handed over to the client on external storage once full settlement is cleared.</p>
                    <p>3. 50% payment of the total budget needs to be cleared on the main event date before dispatch.</p>
                    <p>4. Album production and video edit selection lists must be shared by client within 3 months of raw delivery.</p>
                    <p>5. Output delivery standard timeframe is 60-90 working days post final selections receive-date.</p>
                    <p>6. Meals, transport, travel allowances and overnight hotel stays must be managed fully by the client group.</p>
                    <p>7. Final print/render selection once submitted cannot be edited or modified without surcharge rates.</p>
                    <p>8. Studio preserves copyright ownership to utilize visual snaps in portfolios or online media presence.</p>
                    <p>9. Any event day delay beyond standard 10 working hours is subject to premium staff overtime fees of ₹2,500/hr.</p>
                    <p>10. Under natural hazards, mechanical faults or accidental file losses, studio responsibility is capped up to budget refund values.</p>
                  </div>
                </Card>
              </div>"""

new_content = content[:div_start] + replacement_block + content[else_block_end:]

with open(file_path, "w", encoding="utf-8") as f:
    f.write(new_content)

print("Replacement successful!")
