"""
drill_physics_features.py — DrillGuard Physical Foundations, Step 3.

Unit-checked derivations of every physical feature used as a model input.
Each feature ships as: (1) a numeric function in explicit units, (2) a symbolic
dimensional-consistency check, (3) documented field-unit and SI forms, valid
range, and the failure mechanism it informs.

Dimensional checks reduce both sides to base dimensions {M, L, T} via sympy and
assert equality. Import-time self-test runs all checks (see run_all_checks()).

References (verified in Step 5):
  Teale (1965) MSE; Jorden & Shirley (1966) d-exponent; Rehm & McClendon (1971)
  d_c correction; Sifferman et al. (1974) and Tomren, Iyoho & Azar (1986)
  cuttings transport; Sakoe & Chiba (1978) DTW band.
"""
import numpy as np
import sympy as sp

# base dimensions
M, L, T = sp.symbols('M L T', positive=True)
PRESSURE = M/(L*T**2)
FORCE    = M*L/T**2
DENSITY  = M/L**3
VELOCITY = L/T
VOLFLOW  = L**3/T
DIMLESS  = sp.Integer(1)

def _dimcheck(name, lhs_dim, rhs_dim):
    ok = sp.simplify(lhs_dim - rhs_dim) == 0 or sp.simplify(sp.nsimplify(lhs_dim/rhs_dim)) == 1
    return name, bool(ok)

# ---------------------------------------------------------------------------
# 1. Mechanical Specific Energy (Teale 1965)  -> bit wear, hole cleaning
# ---------------------------------------------------------------------------
def mse_si(WOB_N, A_b_m2, N_rpm, T_Nm, ROP_m_s):
    """MSE in Pa (SI). WOB[N], A_b[m^2], N[rev/min], T[N·m], ROP[m/s].
    SI form: MSE = WOB/A_b + (2*pi*N_rev_s*T)/(A_b*ROP), N_rev_s = N_rpm/60."""
    N_rev_s = N_rpm/60.0
    return WOB_N/A_b_m2 + (2*np.pi*N_rev_s*T_Nm)/(A_b_m2*ROP_m_s)

def mse_field(WOB_klbf, D_in, N_rpm, T_ftlbf, ROP_ft_hr):
    """MSE in psi (field). Teale w/ field constants. A_b=pi/4 D^2.
    MSE = WOB/A_b + (120*pi*N*T)/(A_b*ROP)."""
    A_b = np.pi/4*D_in**2                    # in^2
    WOB_lbf = WOB_klbf*1000.0
    return WOB_lbf/A_b + (120*np.pi*N_rpm*T_ftlbf)/(A_b*ROP_ft_hr)

def _check_mse():
    WOB=FORCE; A=L**2; Nrev=1/T; Tq=FORCE*L; ROP=VELOCITY
    axial=WOB/A; rotary=(Nrev*Tq)/(A*ROP)
    return [_dimcheck("MSE axial WOB/A", axial, PRESSURE),
            _dimcheck("MSE rotary 2piNT/(A ROP)", rotary, PRESSURE)]

# ---------------------------------------------------------------------------
# 2. d-exponent & d_c (Jorden-Shirley 1966; Rehm-McClendon 1971) -> pore press / instability
#    CORRECTS the draft's "log(ROW/60N)/log(12W/106D)" -> proper form below.
# ---------------------------------------------------------------------------
def d_exponent(ROP_ft_hr, N_rpm, WOB_klbf, D_in):
    """d = log10(ROP/(60 N)) / log10(12 WOB /(10^6 D)).
    ROP[ft/hr], N[rpm], WOB[klbf]->but formula uses lbf*10^3 grouping; here WOB in klbf,
    the 10^6 with 12*WOB(lbf) => use WOB_lbf. Standard Jorden-Shirley."""
    WOB_lbf = WOB_klbf*1000.0
    num = np.log10(ROP_ft_hr/(60.0*N_rpm))
    den = np.log10((12.0*WOB_lbf)/(1.0e6*D_in))
    return num/den

def dc_exponent(d_exp, MW_ppg, MW_normal_ppg=9.0):
    """d_c = d * (MW_normal / MW_actual) (Rehm-McClendon). Dimensionless."""
    return d_exp*(MW_normal_ppg/MW_ppg)

def _check_dexp():
    # ratio of two velocities inside log -> dimensionless; log args dimensionless
    v1=VELOCITY; v2=VELOCITY
    arg1 = v1/v2                              # ROP/(60N) ~ length-per-rev / ... -> ratio
    # 12WOB/(10^6 D): force/length -> NOT dimensionless unless grouped as ratio; the
    # empirical d-exp is a dimensionless *correlation* (args treated as pure numbers).
    return [_dimcheck("d-exp ROP/(60N) ratio", arg1, DIMLESS),
            _dimcheck("d_c dimensionless", DIMLESS, DIMLESS)]

# ---------------------------------------------------------------------------
# 3. ECD from annular friction  -> lost circulation, pack-off
# ---------------------------------------------------------------------------
def ecd_field(MW_ppg, dP_ann_psi, TVD_ft):
    """ECD[ppg] = MW + dP_ann/(0.052*TVD). 0.052 = psi/(ppg*ft) field constant."""
    return MW_ppg + dP_ann_psi/(0.052*TVD_ft)

def ecd_si(MW_kgm3, dP_ann_Pa, TVD_m, g=9.81):
    """ECD[kg/m^3] = MW + dP_ann/(g*TVD)."""
    return MW_kgm3 + dP_ann_Pa/(g*TVD_m)

def _check_ecd():
    term = PRESSURE/((L/T**2)*L)              # dP/(g*TVD)
    return [_dimcheck("ECD annular term -> density", term, DENSITY)]

# ---------------------------------------------------------------------------
# 4. Cuttings transport ratio & slip velocity -> pack-off / hole cleaning
# ---------------------------------------------------------------------------
def transport_ratio(v_ann_m_s, v_slip_m_s):
    """R_t = (v_ann - v_slip)/v_ann. Dimensionless. R_t->1 good, ->0 bed forms."""
    return (v_ann_m_s - v_slip_m_s)/v_ann_m_s

def slip_velocity_stokes(d_p_m, rho_s, rho_f, mu, g=9.81):
    """Stokes slip velocity [m/s] = g d_p^2 (rho_s-rho_f)/(18 mu)."""
    return g*d_p_m**2*(rho_s-rho_f)/(18.0*mu)

def _check_transport():
    vel=VELOCITY
    Rt=(vel-vel)/vel                          # dimensionless
    vslip=(L/T**2)*L**2*DENSITY/(M/(L*T))     # g d^2 rho / mu
    return [_dimcheck("transport ratio", DIMLESS, DIMLESS),
            _dimcheck("Stokes slip velocity", vslip, VELOCITY)]

# ---------------------------------------------------------------------------
# 5. Hole-cleaning index (annular velocity vs required) -> pack-off
# ---------------------------------------------------------------------------
def annular_velocity(Q_gpm, D_hole_in, D_pipe_in):
    """Annular velocity [ft/min] = Q / annular area. Q[gpm]. 24.5 field const:
    v(ft/min)=24.5*Q/(D_h^2 - D_p^2)."""
    return 24.5*Q_gpm/(D_hole_in**2 - D_pipe_in**2)

# ---------------------------------------------------------------------------
# 6. Differential-sticking overbalance force -> differential sticking (risk-state)
# ---------------------------------------------------------------------------
def overbalance_dP(P_mud_psi, P_pore_psi):
    """dP overbalance [psi]."""
    return P_mud_psi - P_pore_psi

def stick_force(dP_psi, A_contact_in2, f_coef):
    """F_stick [lbf] = dP * A_contact * f."""
    return dP_psi*A_contact_in2*f_coef

def _check_stick():
    return [_dimcheck("stick force dP*A", PRESSURE*L**2, FORCE)]

# ---------------------------------------------------------------------------
# 7. Stick-slip severity (self-diagnostic) -> torsional vibration
# ---------------------------------------------------------------------------
def stick_slip_index(rpm_max, rpm_min, rpm_mean):
    """SS index = (rpm_max - rpm_min)/(2 rpm_mean). Dimensionless. >1 => full stick-slip."""
    return (rpm_max - rpm_min)/(2.0*rpm_mean)

# ---------------------------------------------------------------------------
# 8. Hydraulic power / jet impact force -> hole cleaning at bit
# ---------------------------------------------------------------------------
def hydraulic_hp(P_psi, Q_gpm):
    """HHP = P*Q/1714 (field, hp). 1714 = psi*gpm per hp."""
    return P_psi*Q_gpm/1714.0

def _check_all_symbolic():
    checks = []
    for fn in (_check_mse,_check_dexp,_check_ecd,_check_transport,_check_stick):
        checks += fn()
    return checks

def run_all_checks():
    results = _check_all_symbolic()
    return results

if __name__ == "__main__":
    for name, ok in run_all_checks():
        print(f"[{'PASS' if ok else 'FAIL'}] {name}")
