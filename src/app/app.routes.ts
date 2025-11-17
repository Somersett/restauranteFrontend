import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { AdminGuard } from './guards/admin.guard';
import { MeseroGuard } from './guards/mesero.guard';
import { CocinaGuard } from './guards/cocina.guard';
import { CajeroGuard } from './guards/cajero.guard';
import { AdminDashboardComponent } from './dashboard/admin-dashboard.component';
import { MeseroDashboardComponent } from './dashboard/mesero-dashboard.component';
import { CocinaDashboardComponent } from './dashboard/cocina-dashboard.component';
import { CajeroDashboardComponent } from './dashboard/cajero-dashboard.component';

export const routes: Routes = [
	{ path: 'login', component: LoginComponent },
	{ path: 'admin', component: AdminDashboardComponent, canActivate: [AdminGuard] },
	{ path: 'mesero', component: MeseroDashboardComponent, canActivate: [MeseroGuard] },
	{ path: 'cocina', component: CocinaDashboardComponent, canActivate: [CocinaGuard] },
	{ path: 'cajero', component: CajeroDashboardComponent, canActivate: [CajeroGuard] },
	{ path: '', redirectTo: 'login', pathMatch: 'full' },
	{ path: '**', redirectTo: 'login' }
];
